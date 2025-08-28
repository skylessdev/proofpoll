/* SPDX-License-Identifier: (MIT OR MPL-2.0) */

import { NextRequest, NextResponse } from "next/server";
import { createDb } from "@/lib/db";

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params;
    const db = createDb();
    
    try {
      const metrics = await db.$queryRaw<{divergence: number, createdAt: Date}[]>`
        SELECT "divergence", "createdAt" 
        FROM "DbtVoteMetric" 
        WHERE "pollId" = ${pollId}
        ORDER BY "createdAt" ASC
      `;
      
      const points = metrics.map((m, i) => ({ 
        t: i + 1, 
        div: m.divergence, 
        ts: m.createdAt 
      }));
      
      const avg = metrics.length 
        ? metrics.reduce((s, m) => s + m.divergence, 0) / metrics.length 
        : 0;
      
      return NextResponse.json({ 
        points, 
        avg, 
        count: metrics.length 
      });
    } finally {
      await db.$disconnect();
    }
  } catch (error) {
    console.error('Failed to fetch DBT summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}