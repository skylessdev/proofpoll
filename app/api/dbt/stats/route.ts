/* SPDX-License-Identifier: (MIT OR MPL-2.0) */

import { NextResponse } from 'next/server'
import { createDb } from '@/lib/db'

export const runtime = 'nodejs'

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
        totalVotes: Number(totalMetrics.count),
        averageDivergence: Number(avgDivergence.avg) || 0,
        verdictDistribution: verdictCounts.map(v => ({ ...v, count: Number(v.count) })),
        averageIntegrity: Number(avgIntegrity.avg) || 0,
        uniqueVoters: Number(totalVoters.count),
        recentActivity: Number(recentActivity.count)
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