import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

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

    // Create poll and options in a transaction
    const result = await db.$transaction(async (tx) => {
      const poll = await tx.poll.create({
        data: {
          question,
        }
      })

      const options = await Promise.all(
        uniqueOptions.map((label) =>
          tx.option.create({
            data: {
              label,
              pollId: poll.id,
            }
          })
        )
      )

      return { poll, options }
    })

    return NextResponse.json({
      id: result.poll.id,
      question: result.poll.question,
      options: result.options.map(opt => ({ id: opt.id, label: opt.label })),
      anon
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Failed to create poll:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}