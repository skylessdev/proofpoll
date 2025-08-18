/* SPDX-License-Identifier: (MIT OR MPL-2.0) */

import { createHmac } from 'crypto'

export function getVoterProofId(source: 'slack' | 'discord', userId: string): string {
  const secret = process.env.PROOF_SECRET!
  return createHmac('sha256', secret)
    .update(`${source}:${userId}`)
    .digest('hex')
}

export function signVote(input: { 
  pollId: string
  optionId: string
  voterProofId: string 
}): { proofHash: string } {
  const secret = process.env.PROOF_SECRET!
  const message = `${input.pollId}:${input.optionId}:${input.voterProofId}`
  
  const proofHash = createHmac('sha256', secret)
    .update(message)
    .digest('hex')
    
  return { proofHash }
}