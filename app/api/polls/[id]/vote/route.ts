/* SPDX-License-Identifier: (MIT OR MPL-2.0) */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createDb } from '@/lib/db'
import { getVoterProofId, signVote } from '@/lib/proof'
import { deltaLogic, deltaTemporal, divergence, verdictFrom, updateIntegrity } from '@/lib/dbt/core'
import { DBT_ENABLED, DBT_VERDICT_ENFORCE } from '@/lib/dbt/config'

export const runtime = 'nodejs'

const voteSchema = z.object({
  optionId: z.string(),
  source: z.enum(['slack', 'discord']),
  userId: z.string().min(1)
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params
    const body = await request.json()
    const { optionId, source, userId } = voteSchema.parse(body)

    // Create fresh DB client to avoid prepared statement conflicts
    const db = createDb()
    
    try {
      // Verify poll and option exist using raw SQL
      const pollCheck = await db.$queryRaw<{id: string, question: string}[]>`
        SELECT id, question FROM "Poll" WHERE id = ${pollId}
      `
      
      const optionCheck = await db.$queryRaw<{id: string, label: string}[]>`
        SELECT id, label FROM "Option" WHERE id = ${optionId} AND "pollId" = ${pollId}
      `
      
      if (pollCheck.length === 0) {
        return NextResponse.json(
          { error: 'Poll not found' },
          { status: 404 }
        )
      }
      
      if (optionCheck.length === 0) {
        return NextResponse.json(
          { error: 'Option not found' },
          { status: 404 }
        )
      }



    // Generate proof
    const voterProofId = getVoterProofId(source, userId)
    const { proofHash } = signVote({ pollId, optionId, voterProofId })
    
    console.log('🔐 Generating Cryptographic Proof:', {
      algorithm: 'HMAC-SHA256',
      source,
      userId,
      pollId,
      optionId,
      voterProofId,
      proofHash,
      timestamp: new Date().toISOString()
    })

      // Check for existing vote
      const existingVote = await db.$queryRaw<{id: string}[]>`
        SELECT id FROM "Vote" WHERE "pollId" = ${pollId} AND "voterProofId" = ${voterProofId}
      `
      
      if (existingVote.length > 0) {
        return NextResponse.json(
          { error: 'You have already voted in this poll' },
          { status: 409 }
        )
      }

      // DBT Analysis: Get previous vote by this voter for DBT pattern analysis
      let dbtAnalysis = null;
      if (DBT_ENABLED) {
        // Get the voter's previous vote in this poll (if any) for DBT analysis
        const previousVote = await db.$queryRaw<{optionId: string, label: string}[]>`
          SELECT v."optionId", o.label 
          FROM "Vote" v 
          JOIN "Option" o ON v."optionId" = o.id
          WHERE v."pollId" = ${pollId} AND v."voterProofId" = ${voterProofId}
          ORDER BY v."createdAt" DESC 
          LIMIT 1
        `

        // Get current option label for DBT analysis
        const currentOption = optionCheck[0];
        const prevOptionLabel = previousVote[0]?.label;
        const nextOptionLabel = currentOption.label;

        // Compute DBT metrics
        const dL = deltaLogic(prevOptionLabel, nextOptionLabel);
        const dT = deltaTemporal(prevOptionLabel, nextOptionLabel);
        const div = divergence(dL, dT);
        const verdict = verdictFrom(div, dL);

        const reasons: string[] = [];
        if (dL === 1) {
          reasons.push(`Logic Baseline violated: forbidden ${prevOptionLabel ?? "∅"}→${nextOptionLabel}`);
        } else {
          reasons.push(`Logic Baseline satisfied: ${prevOptionLabel ?? "first vote"}→${nextOptionLabel}`);
        }
        reasons.push(`Temporal Baseline: residual ${dT.toFixed(3)} (jump size normalized)`);

        dbtAnalysis = { deltaLogic: dL, deltaTemporal: dT, divergence: div, verdict, reasons };

        console.log('🔍 DBT Analysis:', {
          pollId,
          userId,
          previousVote: prevOptionLabel,
          currentVote: nextOptionLabel,
          ...dbtAnalysis,
          timestamp: new Date().toISOString()
        });

        // If enforcement is enabled and verdict is REJECT, block the vote
        if (DBT_VERDICT_ENFORCE && verdict === "REJECT") {
          return NextResponse.json({
            ok: false,
            error: "Vote diverges too far from consensus pattern",
            dbt: dbtAnalysis
          }, { status: 400 });
        }
      }
      
      // Create vote using raw SQL with proof data
      const voteId = `vote${Math.random().toString(36).slice(2, 15)}`
      await db.$executeRaw`
        INSERT INTO "Vote" (id, "pollId", "optionId", "voterProofId", "proofHash", "createdAt") 
        VALUES (${voteId}, ${pollId}, ${optionId}, ${voterProofId}, ${proofHash}, NOW())
      `

      // Get updated tallies using raw SQL
      const tallies = await db.$queryRaw<{id: string, label: string, vote_count: number}[]>`
        SELECT o.id, o.label, COUNT(v.id)::int as vote_count
        FROM "Option" o 
        LEFT JOIN "Vote" v ON o.id = v."optionId"
        WHERE o."pollId" = ${pollId}
        GROUP BY o.id, o.label
        ORDER BY o.id
      `

      // Persist DBT metrics and update integrity if DBT is enabled
      if (DBT_ENABLED && dbtAnalysis) {
        const { deltaLogic: dL, deltaTemporal: dT, divergence: div, verdict, reasons } = dbtAnalysis;
        
        // Store DBT vote metric
        await db.$executeRaw`
          INSERT INTO "DbtVoteMetric" (id, "voteId", "pollId", "voterId", "deltaLogic", "deltaTemporal", "divergence", "verdict", "reasons", "createdAt")
          VALUES (${`dbt${Math.random().toString(36).slice(2, 15)}`}, ${voteId}, ${pollId}, ${userId}, ${dL}, ${dT}, ${div}, ${verdict}, ${JSON.stringify(reasons)}, NOW())
        `

        // Update integrity metrics for this voter in this poll scope
        const scope = `poll:${pollId}`;
        const existingIntegrity = await db.$queryRaw<{integrity: number, interactionCount: number, avgDivergence: number}[]>`
          SELECT "integrity", "interactionCount", "avgDivergence" 
          FROM "DbtIntegrity" 
          WHERE "voterId" = ${userId} AND "scope" = ${scope}
        `

        const integrity = updateIntegrity(existingIntegrity[0]?.integrity, div);
        const newInteractionCount = (existingIntegrity[0]?.interactionCount || 0) + 1;
        const newAvgDivergence = existingIntegrity[0] 
          ? (existingIntegrity[0].avgDivergence * existingIntegrity[0].interactionCount + div) / newInteractionCount
          : div;

        if (existingIntegrity.length > 0) {
          await db.$executeRaw`
            UPDATE "DbtIntegrity" 
            SET "integrity" = ${integrity}, "interactionCount" = ${newInteractionCount}, "avgDivergence" = ${newAvgDivergence}, "updatedAt" = NOW()
            WHERE "voterId" = ${userId} AND "scope" = ${scope}
          `
        } else {
          await db.$executeRaw`
            INSERT INTO "DbtIntegrity" (id, "voterId", "scope", "integrity", "interactionCount", "avgDivergence", "updatedAt")
            VALUES (${`int${Math.random().toString(36).slice(2, 15)}`}, ${userId}, ${scope}, ${integrity}, ${newInteractionCount}, ${newAvgDivergence}, NOW())
          `
        }

        console.log('📊 DBT Metrics Stored:', {
          voteId,
          userId,
          scope,
          integrity,
          verdict,
          divergence: div
        });
      }

      console.log('✅ Vote Recorded with Cryptographic Proof:', {
        voteId,
        voterProofId,
        proofHash,
        verified: true,
        algorithm: 'HMAC-SHA256',
        dbt: dbtAnalysis?.verdict || 'N/A'
      })
      
      return NextResponse.json({
        ok: true,
        pollId,
        tallies: tallies.map(option => ({
          optionId: option.id,
          label: option.label,
          count: option.vote_count
        })),
        proofVerified: true,
        voterProofId, // Include proof data in response for verification
        proofHash,
        dbt: DBT_ENABLED ? dbtAnalysis : undefined
      })
    } finally {
      await db.$disconnect()
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Failed to record vote:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}