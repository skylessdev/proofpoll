import nacl from 'tweetnacl'

const hexToUint8Array = (hex: string) =>
  new Uint8Array(hex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)))

export async function verifyDiscord(req: Request): Promise<{ rawBody: string }> {
  const rawBody = await req.text()
  const signature = req.headers.get('x-signature-ed25519')
  const timestamp = req.headers.get('x-signature-timestamp')
  
  // Debug logs (dev only)
  console.log(`Discord verify: headers present - timestamp: ${!!timestamp}, signature: ${!!signature}, body length: ${rawBody.length}`)
  
  if (!signature || !timestamp) {
    console.log('Discord verify: FAIL - Missing headers')
    throw new Error('Missing Discord signature headers')
  }
  
  if (!process.env.DISCORD_PUBLIC_KEY) {
    console.log('Discord verify: FAIL - Missing DISCORD_PUBLIC_KEY')
    throw new Error('DISCORD_PUBLIC_KEY environment variable not set')
  }
  
  // Verify Ed25519 signature using proper encoding
  try {
    const message = new TextEncoder().encode(timestamp + rawBody)
    const signatureBytes = hexToUint8Array(signature)
    const publicKeyBytes = hexToUint8Array(process.env.DISCORD_PUBLIC_KEY)
    
    const ok = nacl.sign.detached.verify(message, signatureBytes, publicKeyBytes)
    
    if (!ok) {
      console.log('Discord verify: FAIL - Invalid signature')
      throw new Error('Invalid Discord signature')
    }
  } catch (error: any) {
    console.log(`Discord verify: FAIL - Verification error: ${error.message}`)
    throw new Error('Invalid Discord signature')
  }
  
  console.log('Discord verify: PASS - Signature validated')
  return { rawBody }
}