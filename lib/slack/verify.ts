/* SPDX-License-Identifier: (MIT OR MPL-2.0) */

import { createHmac } from 'crypto'

export async function verifySlack(req: Request): Promise<{ ok: true; rawBody: string; ts: string; sig: string }> {
  const rawBody = await req.text()
  const timestamp = req.headers.get('x-slack-request-timestamp')
  const signature = req.headers.get('x-slack-signature')
  
  if (!timestamp || !signature) {
    throw new Error('Missing Slack signature headers')
  }
  
  // Check timestamp is within 5 minutes
  const now = Math.floor(Date.now() / 1000)
  const requestTime = parseInt(timestamp)
  if (Math.abs(now - requestTime) > 300) {
    throw new Error('Request timestamp too old')
  }
  
  // Compute expected signature
  const signingSecret = process.env.SLACK_SIGNING_SECRET!
  const basestring = `v0:${timestamp}:${rawBody}`
  const expectedSig = 'v0=' + createHmac('sha256', signingSecret)
    .update(basestring)
    .digest('hex')
  
  // Constant-time comparison
  if (!constantTimeCompare(signature, expectedSig)) {
    throw new Error('Invalid signature')
  }
  
  return { ok: true, rawBody, ts: timestamp, sig: signature }
}

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  
  return result === 0
}