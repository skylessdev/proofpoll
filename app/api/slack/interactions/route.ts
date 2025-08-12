import { NextRequest, NextResponse } from 'next/server'
import { verifySlack } from '@/lib/slack/verify'
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
    
    // Parse URL-encoded body and extract payload
    const params = new URLSearchParams(rawBody)
    const payloadString = params.get('payload')
    
    if (!payloadString) {
      throw new Error('Missing payload')
    }
    
    const payload = JSON.parse(payloadString)
    
    // Handle button actions
    if (payload.type === 'block_actions') {
      const action = payload.actions[0]
      const user = payload.user
      const responseUrl = payload.response_url
      
      if (!action || !user || !responseUrl) {
        throw new Error('Missing action, user data, or response_url')
      }
      
      // Parse button value
      const { pollId, optionId } = JSON.parse(action.value)
      const baseUrl = baseUrlFrom(request)
      
      // Return 200 immediately to prevent timeout
      const response = new Response('', { status: 200 })
      
      // Process vote asynchronously
      queueMicrotask(async () => {
        try {
          // Record vote via our API
          const voteResponse = await fetch(`${baseUrl}/api/polls/${pollId}/vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              optionId,
              source: 'slack',
              userId: user.id
            })
          })
          
          if (voteResponse.status === 409) {
            // Duplicate vote - send ephemeral message
            await fetch(responseUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                response_type: 'ephemeral',
                text: 'You already voted in this poll.'
              })
            })
            return
          }
          
          if (!voteResponse.ok) {
            await fetch(responseUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                response_type: 'ephemeral',
                text: 'Error: Failed to record vote'
              })
            })
            return
          }
          
          // Get updated poll data
          const pollResponse = await fetch(`${baseUrl}/api/polls/${pollId}`)
          if (!pollResponse.ok) {
            await fetch(responseUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                response_type: 'ephemeral',
                text: 'Vote recorded ✅'
              })
            })
            return
          }
          
          const poll = await pollResponse.json()
          
          // Build updated blocks with tallies
          const blocks = [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*${poll.question}*`
              }
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: poll.options.map((option: any) => 
                  `• *${option.label}*: ${option.count} vote${option.count !== 1 ? 's' : ''}`
                ).join('\\n')
              }
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
          
          // Update original message with new tallies
          await fetch(responseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              replace_original: true,
              blocks
            })
          })
          
        } catch (error) {
          console.error('Async vote processing error:', error)
          // Send error message via response_url
          try {
            await fetch(responseUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                response_type: 'ephemeral',
                text: 'Error processing vote. Please try again.'
              })
            })
          } catch (e) {
            console.error('Failed to send error response:', e)
          }
        }
      })
      
      return response
    }
    
    // Unknown interaction type
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'Unknown interaction type'
    })
    
  } catch (error: any) {
    console.error('Slack interaction error:', error)
    return NextResponse.json({
      response_type: 'ephemeral',
      text: `Error: ${error.message}`
    })
  }
}