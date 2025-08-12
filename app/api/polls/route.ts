import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createDb } from '@/lib/db'

export const runtime = 'nodejs'

const createPollSchema = z.object({
  question: z.string().trim().min(5).max(200),
  options: z.array(z.string().trim()).min(2).max(10),
  anon: z.boolean().optional().default(false)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { question, options: rawOptions, anon } = createPollSchema.parse(body)
    
    // Dedupe and filter empty options
    const uniqueOptions = Array.from(new Set(rawOptions)).filter(opt => opt.length > 0)
    
    if (uniqueOptions.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 unique non-empty options are required' },
        { status: 400 }
      )
    }

    // Use raw SQL queries to bypass prepared statement conflicts
    const db = createDb()
    
    try {
      const pollId = `cme${Math.random().toString(36).slice(2, 15)}`
      
      // Insert poll using raw SQL
      await db.$executeRaw`INSERT INTO "Poll" (id, question, "createdAt") VALUES (${pollId}, ${question}, NOW())`
      
      // Insert options and collect results
      const options = []
      for (const label of uniqueOptions) {
        const optionId = `opt${Math.random().toString(36).slice(2, 15)}`
        await db.$executeRaw`INSERT INTO "Option" (id, label, "pollId") VALUES (${optionId}, ${label}, ${pollId})`
        options.push({ id: optionId, label })
      }

      return NextResponse.json({
        id: pollId,
        question,
        options,
        anon
      })
    } finally {
      await db.$disconnect()
    }

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    // Enhanced Prisma error logging
    console.error('Failed to create poll:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      clientVersion: error.clientVersion,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 5).join('\n') // First 5 lines only
    })
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}