import { NextRequest, NextResponse } from 'next/server'
import { verifyDiscord } from '@/lib/discord/verify'
import { parsePollCommand } from '@/utils/parse'
import { baseUrlFrom } from '@/lib/http'
import { buildDiscordButtons, buildTallyContent } from '@/utils/discord'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Verify Discord signature
    const { rawBody } = await verifyDiscord(request)
    const body = JSON.parse(rawBody)
    
    // Handle PING
    if (body.type === 1) {
      return NextResponse.json({ type: 1 })
    }
    
    // Handle slash command
    if (body.type === 2 && body.data?.name === 'poll') {
      const text = body.data.options?.[0]?.value ?? ''
      
      // Parse poll command
      let pollData
      try {
        pollData = parsePollCommand(text)
      } catch (error: any) {
        return NextResponse.json({
          type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
          data: {
            content: `Error: ${error.message}`,
            flags: 64 // EPHEMERAL
          }
        })
      }
      
      // Create poll via our API
      const baseUrl = baseUrlFrom(request)
      const pollResponse = await fetch(`${baseUrl}/api/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pollData)
      })
      
      if (!pollResponse.ok) {
        return NextResponse.json({
          type: 4,
          data: {
            content: 'Error: Failed to create poll',
            flags: 64 // EPHEMERAL
          }
        })
      }
      
      const poll = await pollResponse.json()
      
      // Build Discord message with buttons
      const components = buildDiscordButtons(poll, baseUrl)
      
      return NextResponse.json({
        type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
        data: {
          content: `**${poll.question}**`,
          components,
          flags: 0 // PUBLIC
        }
      })
    }
    
    // Handle button interactions
    if (body.type === 3 && body.data?.component_type === 2) {
      const { pollId, optionId } = JSON.parse(body.data.custom_id)
      const userId = body.member?.user?.id || body.user?.id
      
      if (!userId) {
        return NextResponse.json({
          type: 4,
          data: {
            content: 'Error: Unable to identify user',
            flags: 64 // EPHEMERAL
          }
        })
      }
      
      // Record vote via our API
      const baseUrl = baseUrlFrom(request)
      const voteResponse = await fetch(`${baseUrl}/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          optionId,
          source: 'discord',
          userId
        })
      })
      
      if (voteResponse.status === 409) {
        // Duplicate vote
        return NextResponse.json({
          type: 4,
          data: {
            content: 'You already voted in this poll.',
            flags: 64 // EPHEMERAL
          }
        })
      }
      
      if (!voteResponse.ok) {
        return NextResponse.json({
          type: 4,
          data: {
            content: 'Error: Failed to record vote',
            flags: 64 // EPHEMERAL
          }
        })
      }
      
      // Get updated poll data
      const pollResponse = await fetch(`${baseUrl}/api/polls/${pollId}`)
      if (!pollResponse.ok) {
        return NextResponse.json({
          type: 4,
          data: {
            content: 'Vote recorded ✅',
            flags: 64 // EPHEMERAL
          }
        })
      }
      
      const poll = await pollResponse.json()
      
      // Build updated message with tallies
      const content = buildTallyContent(poll)
      const components = buildDiscordButtons(poll, baseUrl)
      
      return NextResponse.json({
        type: 7, // UPDATE_MESSAGE
        data: {
          content,
          components
        }
      })
    }
    
    // Unknown interaction type
    return NextResponse.json({
      type: 4,
      data: {
        content: 'Unknown interaction type',
        flags: 64 // EPHEMERAL
      }
    })
    
  } catch (error: any) {
    console.error('Discord interaction error:', error)
    return NextResponse.json({
      type: 4,
      data: {
        content: `Error: ${error.message}`,
        flags: 64 // EPHEMERAL
      }
    })
  }
}