/* SPDX-License-Identifier: (MIT OR MPL-2.0) */

import { NextRequest, NextResponse } from 'next/server'
import { createDb } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    
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
        LIMIT ${limit}
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