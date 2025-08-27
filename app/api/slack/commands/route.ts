/* SPDX-License-Identifier: (MIT OR MPL-2.0) */

import { NextRequest, NextResponse } from 'next/server'
import { verifySlack } from '@/lib/slack/verify'
import { parsePollCommand } from '@/utils/parse'
import { baseUrlFrom } from '@/lib/http'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const debugMode = process.env.DEBUG_SLACK === '1'
  
  if (debugMode) {
    console.log(`[SLACK] ${startTime} - Command request: ${request.method} ${request.headers.get('content-type')} bodySize=${request.headers.get('content-length')}`)
  }
  
  try {
    // Handle Slack retries - return 200 immediately to avoid double-processing
    if (request.headers.get('x-slack-retry-num')) {
      return new Response('', { status: 200 })
    }
    
    // Verify Slack signature - let auth errors bubble up as 401
    const { rawBody } = await verifySlack(request)
    const verifyTime = Date.now()
    
    if (debugMode) {
      console.log(`[SLACK] ${verifyTime} - Verification PASS (${verifyTime - startTime}ms)`)
    }
    
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
    
    // Fast ACK - return within 1.5s to avoid dispatch_failed
    const fastAckResponse = NextResponse.json({
      response_type: 'ephemeral',
      text: 'Creating poll...'
    })
    
    const responseUrl = params.get('response_url')
    
    // Start async poll creation (don't await)
    if (responseUrl) {
      createPollAsync(text, request, responseUrl, debugMode, startTime)
    }
    
    if (debugMode) {
      const ackTime = Date.now()
      console.log(`[SLACK] ${ackTime} - Fast ACK sent (${ackTime - startTime}ms)`)
    }
    
    return fastAckResponse
    
  } catch (error: any) {
    const errorTime = Date.now()
    
    if (debugMode) {
      console.log(`[SLACK] ${errorTime} - Verification FAIL (${errorTime - startTime}ms): ${error.message}`)
    }
    
    // Return 401 for signature verification failures
    if (error.message.includes('signature') || error.message.includes('timestamp')) {
      return new Response(JSON.stringify({
        response_type: 'ephemeral',
        text: `Error: ${error.message}`
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    console.error('Slack command error:', error)
    return NextResponse.json({
      response_type: 'ephemeral',
      text: `Error: ${error.message}`
    })
  }
}

// Async function to create poll and send via response_url
async function createPollAsync(text: string, request: NextRequest, responseUrl: string, debugMode: boolean, startTime: number) {
  try {
    // Parse poll command
    const pollData = parsePollCommand(text)
    
    // Create poll via our API
    const baseUrl = baseUrlFrom(request)
    const pollResponse = await fetch(`${baseUrl}/api/polls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pollData)
    })
    
    if (!pollResponse.ok) {
      throw new Error('Failed to create poll')
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
    
    // Send poll via response_url
    const followUpResponse = await fetch(responseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        response_type: 'in_channel',
        replace_original: true,
        blocks
      })
    })
    
    if (debugMode) {
      const completedTime = Date.now()
      console.log(`[SLACK] ${completedTime} - Poll creation completed (${completedTime - startTime}ms) - Response: ${followUpResponse.status}`)
    }
    
  } catch (error: any) {
    console.error('Async poll creation failed:', error)
    
    // Send error via response_url
    try {
      await fetch(responseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response_type: 'ephemeral',
          replace_original: true,
          text: `Error creating poll: ${error.message}`
        })
      })
    } catch (followUpError) {
      console.error('Failed to send error via response_url:', followUpError)
    }
  }
}