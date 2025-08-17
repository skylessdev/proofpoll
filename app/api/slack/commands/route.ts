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
    
    const timestamp = new Date().toISOString()
    const remoteIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const slackTimestamp = request.headers.get('x-slack-request-timestamp') || 'missing'
    const currentTime = Math.floor(Date.now() / 1000)
    const timestampDelta = slackTimestamp !== 'missing' ? currentTime - parseInt(slackTimestamp) : 'N/A'
    
    console.log(`[${timestamp}] SLACK COMMAND - Method: POST, Path: /api/slack/commands, Remote IP: ${remoteIP}, X-Slack-Request-Timestamp: ${slackTimestamp}, Delta: ${timestampDelta}s`)
    
    // Get baseUrl for logging
    const baseUrl = baseUrlFrom(request)
    console.log(`[${timestamp}] Server believes base URL: ${baseUrl}`)
    
    // Verify Slack signature
    let verifyResult: any
    try {
      verifyResult = await verifySlack(request)
      console.log(`[${timestamp}] verifySlack() PASS - signature validated`)
    } catch (error: any) {
      console.log(`[${timestamp}] verifySlack() FAIL - ${error.message}`)
      throw error
    }
    
    const { rawBody } = verifyResult
    
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
    
    // Create poll via our API (baseUrl already logged above)
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
    
    const response = {
      response_type: 'in_channel',
      blocks
    }
    
    console.log(`[${timestamp}] Returning JSON response: ${JSON.stringify(response).substring(0, 150)}...`)
    
    return NextResponse.json(response)
    
  } catch (error: any) {
    console.error('Slack command error:', error)
    return NextResponse.json({
      response_type: 'ephemeral',
      text: `Error: ${error.message}`
    })
  }
}