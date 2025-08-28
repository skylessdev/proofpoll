/* SPDX-License-Identifier: (MIT OR MPL-2.0) */

import { NextResponse } from 'next/server'
import { createDb } from '@/lib/db'

export const runtime = 'nodejs'

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
      
      // Convert BigInt values to numbers for JSON serialization
      const serializedConsensus = consensus.map(item => ({
        timestamp: item.timestamp,
        avgDivergence: Number(item.avgDivergence),
        voteCount: Number(item.voteCount),
        pollId: item.pollId
      }));
      
      return NextResponse.json(serializedConsensus)
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