/* SPDX-License-Identifier: (MIT OR MPL-2.0) */

import { NextRequest, NextResponse } from 'next/server'
import { createDb } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  try {
    const { pollId } = await params
    const db = createDb()
    
    try {
      // Get poll details
      const [poll] = await db.$queryRaw<Array<{
        id: string;
        question: string;
        createdAt: string;
      }>>`
        SELECT id, question, "createdAt"
        FROM "Poll" 
        WHERE id = ${pollId}
      `
      
      if (!poll) {
        return NextResponse.json(
          { error: 'Poll not found' },
          { status: 404 }
        )
      }
      
      // Get vote options and tallies
      const options = await db.$queryRaw<Array<{
        id: string;
        label: string;
        voteCount: number;
      }>>`
        SELECT 
          o.id,
          o.label,
          COUNT(v.id) as "voteCount"
        FROM "Option" o
        LEFT JOIN "Vote" v ON o.id = v."optionId"
        WHERE o."pollId" = ${pollId}
        GROUP BY o.id, o.label
        ORDER BY o.id
      `
      
      // Get DBT metrics for this poll
      const metrics = await db.$queryRaw<Array<{
        voterId: string;
        deltaLogic: number;
        deltaTemporal: number;
        divergence: number;
        verdict: string;
        createdAt: string;
      }>>`
        SELECT 
          "voterId",
          "deltaLogic",
          "deltaTemporal",
          "divergence",
          "verdict",
          "createdAt"
        FROM "DbtVoteMetric"
        WHERE "pollId" = ${pollId}
        ORDER BY "createdAt" ASC
      `
      
      // Calculate consensus metrics
      const totalVotes = metrics.length;
      const avgDivergence = totalVotes > 0 
        ? metrics.reduce((sum, m) => sum + m.divergence, 0) / totalVotes 
        : 0;
        
      const verdictCounts = metrics.reduce((acc, m) => {
        acc[m.verdict] = (acc[m.verdict] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Consensus timeline (chronological divergence)
      const timeline = metrics.map((m, i) => ({
        timestamp: m.createdAt,
        divergence: m.divergence,
        cumulativeAvg: metrics.slice(0, i + 1)
          .reduce((sum, metric) => sum + metric.divergence, 0) / (i + 1)
      }));
      
      return NextResponse.json({
        poll: {
          id: poll.id,
          question: poll.question,
          createdAt: poll.createdAt
        },
        options,
        consensus: {
          totalVotes,
          averageDivergence: avgDivergence,
          verdictDistribution: verdictCounts,
          timeline,
          consensusStrength: Math.max(0, 1 - avgDivergence)
        },
        voters: {
          total: new Set(metrics.map(m => m.voterId)).size,
          highIntegrity: metrics.filter(m => m.divergence < 0.3).length,
          suspicious: metrics.filter(m => m.verdict === 'SUSPICIOUS' || m.verdict === 'REJECT').length
        }
      })
    } finally {
      await db.$disconnect()
    }
  } catch (error) {
    console.error('Failed to fetch poll analysis:', error)
    return NextResponse.json(
      { error: 'Failed to fetch poll analysis' },
      { status: 500 }
    )
  }
}