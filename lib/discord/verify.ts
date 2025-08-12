import nacl from 'tweetnacl'

export async function verifyDiscord(req: Request): Promise<{ rawBody: string }> {
  const rawBody = await req.text()
  const signature = req.headers.get('x-signature-ed25519')
  const timestamp = req.headers.get('x-signature-timestamp')
  
  if (!signature || !timestamp) {
    throw new Error('Missing Discord signature headers')
  }
  
  if (!process.env.DISCORD_PUBLIC_KEY) {
    throw new Error('DISCORD_PUBLIC_KEY environment variable not set')
  }
  
  // Verify Ed25519 signature
  const ok = nacl.sign.detached.verify(
    Buffer.from(timestamp + rawBody),
    Buffer.from(signature, 'hex'),
    Buffer.from(process.env.DISCORD_PUBLIC_KEY, 'hex')
  )
  
  if (!ok) {
    throw new Error('Invalid Discord signature')
  }
  
  return { rawBody }
}