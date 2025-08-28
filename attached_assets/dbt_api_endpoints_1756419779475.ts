// app/api/dbt/metrics/route.ts - Get recent DBT vote metrics
/* SPDX-License-Identifier: (MIT OR MPL-2.0) */

import { NextResponse } from 'next/server'
import { createDb } from '@/lib/db'

export async function GET() {
  try {
    const db = createDb()
    
    try {
      // Get recent DBT metrics with poll information
      const metrics = await db.$queryRaw<Array<{
        id: string;
        pollId: string;
        voterId: string;
        deltaLogic: number;
        deltaTemporal: number;
        divergence: number;
        verdict: string;
        reasons: string;
        createdAt: string;
        question: string;
      }>>`
        SELECT 
          dvm.id,
          dvm."pollId",
          dvm."voterId",
          dvm."deltaLogic",
          dvm."deltaTemporal",
          dvm."divergence",
          dvm."verdict",
          dvm."reasons",
          dvm."createdAt",
          p."question"
        FROM "DbtVoteMetric" dvm
        JOIN "Poll" p ON dvm."pollId" = p.id
        ORDER BY dvm."createdAt" DESC
        LIMIT 100
      `
      
      // Parse JSON reasons field
      const processedMetrics = metrics.map(m => ({
        ...m,
        reasons: JSON.parse(m.reasons || '[]'),
        poll: {
          question: m.question
        }
      }));
      
      return NextResponse.json(processedMetrics)
    } finally {
      await db.$disconnect()
    }
  } catch (error) {
    console.error('Failed to fetch DBT metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}

// app/api/dbt/integrity/route.ts - Get voter integrity scores
/* SPDX-License-Identifier: (MIT OR MPL-2.0) */

import { NextResponse } from 'next/server'
import { createDb } from '@/lib/db'

export async function GET() {
  try {
    const db = createDb()
    
    try {
      const integrity = await db.$queryRaw<Array<{
        voterId: string;
        scope: string;
        integrity: number;
        interactionCount: number;
        avgDivergence: number;
        updatedAt: string;
      }>>`
        SELECT 
          "voterId",
          "scope",
          "integrity",
          "interactionCount",
          "avgDivergence",
          "updatedAt"
        FROM "DbtIntegrity"
        ORDER BY "integrity" DESC, "interactionCount" DESC
      `
      
      return NextResponse.json(integrity)
    } finally {
      await db.$disconnect()
    }
  } catch (error) {
    console.error('Failed to fetch integrity scores:', error)
    return NextResponse.json(
      { error: 'Failed to fetch integrity scores' },
      { status: 500 }
    )
  }
}

// app/api/dbt/consensus/route.ts - Get consensus evolution data
/* SPDX-License-Identifier: (MIT OR MPL-2.0) */

import { NextResponse } from 'next/server'
import { createDb } from '@/lib/db'

export async function GET() {
  try {
    const db = createDb()
    
    try {
      // Generate consensus timeline by grouping votes by time windows
      const consensus = await db.$queryRaw<Array<{
        timestamp: string;
        avgDivergence: number;
        voteCount: number;
        pollId: string;
      }>>`
        SELECT 
          DATE_TRUNC('minute', dvm."createdAt") as timestamp,
          AVG(dvm."divergence") as "avgDivergence",
          COUNT(*) as "voteCount",
          dvm."pollId"
        FROM "DbtVoteMetric" dvm
        WHERE dvm."createdAt" > NOW() - INTERVAL '24 hours'
        GROUP BY DATE_TRUNC('minute', dvm."createdAt"), dvm."pollId"
        ORDER BY timestamp DESC
        LIMIT 50
      `
      
      return NextResponse.json(consensus)
    } finally {
      await db.$disconnect()
    }
  } catch (error) {
    console.error('Failed to fetch consensus data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch consensus data' },
      { status: 500 }
    )
  }
}

// app/api/dbt/stats/route.ts - Get aggregate DBT statistics
/* SPDX-License-Identifier: (MIT OR MPL-2.0) */

import { NextResponse } from 'next/server'
import { createDb } from '@/lib/db'

export async function GET() {
  try {
    const db = createDb()
    
    try {
      // Get aggregate statistics
      const [totalMetrics] = await db.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*) as count FROM "DbtVoteMetric"
      `
      
      const [avgDivergence] = await db.$queryRaw<Array<{ avg: number }>>`
        SELECT AVG("divergence") as avg FROM "DbtVoteMetric"
      `
      
      const verdictCounts = await db.$queryRaw<Array<{
        verdict: string;
        count: number;
      }>>`
        SELECT "verdict", COUNT(*) as count 
        FROM "DbtVoteMetric" 
        GROUP BY "verdict"
        ORDER BY count DESC
      `
      
      const [avgIntegrity] = await db.$queryRaw<Array<{ avg: number }>>`
        SELECT AVG("integrity") as avg FROM "DbtIntegrity"
      `
      
      const [totalVoters] = await db.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(DISTINCT "voterId") as count FROM "DbtIntegrity"
      `
      
      // Recent activity (last 24h)
      const [recentActivity] = await db.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*) as count 
        FROM "DbtVoteMetric" 
        WHERE "createdAt" > NOW() - INTERVAL '24 hours'
      `
      
      return NextResponse.json({
        totalVotes: totalMetrics.count,
        averageDivergence: Number(avgDivergence.avg) || 0,
        verdictDistribution: verdictCounts,
        averageIntegrity: Number(avgIntegrity.avg) || 0,
        uniqueVoters: totalVoters.count,
        recentActivity: recentActivity.count
      })
    } finally {
      await db.$disconnect()
    }
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}

// app/api/dbt/polls/[pollId]/analysis/route.ts - Get detailed analysis for a specific poll
/* SPDX-License-Identifier: (MIT OR MPL-2.0) */

import { NextRequest, NextResponse } from 'next/server'
import { createDb } from '@/lib/db'

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