/* SPDX-License-Identifier: (MIT OR MPL-2.0) */

import { NextRequest, NextResponse } from 'next/server'
import { createDb } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      console.error('Slack OAuth error:', error)
      return NextResponse.json(
        { error: 'OAuth authorization failed' },
        { status: 400 }
      )
    }

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code missing' },
        { status: 400 }
      )
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        code,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token')
    }

    const tokenData = await tokenResponse.json()

    if (!tokenData.ok) {
      console.error('Slack token exchange error:', tokenData.error)
      return NextResponse.json(
        { error: 'Token exchange failed' },
        { status: 400 }
      )
    }

    // Extract the necessary data
    const accessToken = tokenData.access_token
    const teamId = tokenData.team?.id
    const teamName = tokenData.team?.name
    const botUserId = tokenData.bot_user_id

    if (!accessToken || !teamId || !teamName || !botUserId) {
      console.error('Missing required OAuth response data:', { accessToken: !!accessToken, teamId, teamName, botUserId })
      return NextResponse.json(
        { error: 'Invalid OAuth response data' },
        { status: 400 }
      )
    }

    // Store team data in database
    const db = createDb()
    try {
      await db.slackTeam.upsert({
        where: { id: teamId },
        update: {
          accessToken,
          botUserId,
          teamName,
          installedAt: new Date(),
        },
        create: {
          id: teamId,
          accessToken,
          botUserId,
          teamName,
          installedAt: new Date(),
        },
      })

      console.log(`Slack app installed for team: ${teamName} (${teamId})`)

      // Return success page
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
        <head>
          <title>ProofPoll Installation Successful</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: system-ui, sans-serif; 
              max-width: 500px; 
              margin: 100px auto; 
              padding: 20px; 
              text-align: center; 
            }
            .success { color: #28a745; }
            .info { color: #666; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1 class="success">✅ ProofPoll Successfully Installed!</h1>
          <p>ProofPoll has been installed to <strong>${teamName}</strong> workspace.</p>
          <p class="info">You can now use the <code>/poll</code> slash command in Slack to create polls with cryptographic proof.</p>
          <p class="info">This window can be closed.</p>
        </body>
        </html>`,
        {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }
      )

    } finally {
      await db.$disconnect()
    }

  } catch (error: any) {
    console.error('OAuth redirect error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}