import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getVoterProofId, signVote } from '@/lib/proof'

export const runtime = 'nodejs'

const voteSchema = z.object({
  optionId: z.string(),
  source: z.enum(['slack', 'discord']),
  userId: z.string().min(1)
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params
    const body = await request.json()
    const { optionId, source, userId } = voteSchema.parse(body)

    // Verify poll and option exist
    const poll = await db.poll.findUnique({
      where: { id: pollId },
      include: {
        options: { where: { id: optionId } }
      }
    })

    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    if (poll.options.length === 0) {
      return NextResponse.json(
        { error: 'Option not found' },
        { status: 404 }
      )
    }

    // Generate proof
    const voterProofId = getVoterProofId(source, userId)
    const { proofHash } = signVote({ pollId, optionId, voterProofId })

    try {
      // Attempt to create vote (will fail if duplicate due to unique constraint)
      await db.vote.create({
        data: {
          pollId,
          optionId,
          voterProofId,
          proofHash
        }
      })
    } catch (error: any) {
      // Check if this is a unique constraint violation (Prisma error code P2002)
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'You have already voted in this poll' },
          { status: 409 }
        )
      }
      throw error
    }

    // Get updated tallies
    const tallies = await db.option.findMany({
      where: { pollId },
      include: {
        _count: {
          select: { votes: true }
        }
      }
    })

    return NextResponse.json({
      ok: true,
      tallies: tallies.map(option => ({
        optionId: option.id,
        count: option._count.votes
      })),
      proofVerified: true
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Failed to record vote:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}