/* SPDX-License-Identifier: (MIT OR MPL-2.0) */

import { NextResponse } from 'next/server'
import { createDb } from '@/lib/db'

export const runtime = 'nodejs'

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