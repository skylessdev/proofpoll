import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const poll = await db.poll.findUnique({
      where: { id },
      include: {
        options: {
          include: {
            _count: {
              select: { votes: true }
            }
          }
        }
      }
    })

    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: poll.id,
      question: poll.question,
      options: poll.options.map(option => ({
        id: option.id,
        label: option.label,
        count: option._count.votes
      })),
      proofVerified: true
    })

  } catch (error) {
    console.error('Failed to get poll:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}