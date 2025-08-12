import { NextRequest, NextResponse } from 'next/server'
import { verifySlack } from '@/lib/slack/verify'
import { parsePollCommand } from '@/utils/parse'
import { baseUrlFrom } from '@/lib/http'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Handle Slack retries - return 200 immediately to avoid double-processing
    if (request.headers.get('x-slack-retry-num')) {
      return new Response('', { status: 200 })
    }
    
    // Verify Slack signature
    const { rawBody } = await verifySlack(request)
    
    // Parse URL-encoded body
    const params = new URLSearchParams(rawBody)
    const userId = params.get('user_id')
    const channelId = params.get('channel_id') 
    const text = params.get('text') || ''
    
    if (!userId || !channelId) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'Error: Missing user or channel information'
      })
    }
    
    // Parse poll command
    let pollData
    try {
      pollData = parsePollCommand(text)
    } catch (error: any) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: `Error: ${error.message}`
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
        response_type: 'ephemeral',
        text: 'Error: Failed to create poll'
      })
    }
    
    const poll = await pollResponse.json()
    
    // Build Slack blocks
    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${poll.question}*`
        }
      },
      {
        type: 'actions',
        elements: poll.options.map((option: any) => ({
          type: 'button',
          text: {
            type: 'plain_text',
            text: option.label
          },
          value: JSON.stringify({ pollId: poll.id, optionId: option.id }),
          action_id: `vote_${option.id}`
        }))
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `View results: ${baseUrl}/polls/${poll.id}`
          }
        ]
      }
    ]
    
    return NextResponse.json({
      response_type: 'in_channel',
      blocks
    })
    
  } catch (error: any) {
    console.error('Slack command error:', error)
    return NextResponse.json({
      response_type: 'ephemeral',
      text: `Error: ${error.message}`
    })
  }
}