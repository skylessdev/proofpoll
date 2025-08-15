import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createDb } from '@/lib/db'
import { getVoterProofId, signVote } from '@/lib/proof'

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
        proofHash
      })
    } finally {
      await db.$disconnect()
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
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