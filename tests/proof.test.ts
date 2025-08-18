/* SPDX-License-Identifier: (MIT OR MPL-2.0) */

import { describe, it, expect, beforeAll } from 'vitest'
import { getVoterProofId, signVote } from '../lib/proof'

// Set test environment variables
beforeAll(() => {
  process.env.PROOF_SECRET = 'test-secret-key-for-testing'
})

describe('getVoterProofId', () => {
  it('should return same proofId for same inputs', () => {
    const proofId1 = getVoterProofId('slack', 'user123')
    const proofId2 = getVoterProofId('slack', 'user123')
    
    expect(proofId1).toBe(proofId2)
    expect(proofId1).toMatch(/^[a-f0-9]{64}$/) // SHA256 hex string
  })

  it('should return different proofId for different source', () => {
    const slackProofId = getVoterProofId('slack', 'user123')
    const discordProofId = getVoterProofId('discord', 'user123')
    
    expect(slackProofId).not.toBe(discordProofId)
  })

  it('should return different proofId for different userId', () => {
    const proofId1 = getVoterProofId('slack', 'user123')
    const proofId2 = getVoterProofId('slack', 'user456')
    
    expect(proofId1).not.toBe(proofId2)
  })
})

describe('signVote', () => {
  it('should return same proofHash for same inputs', () => {
    const input = {
      pollId: 'poll123',
      optionId: 'option456',
      voterProofId: 'voter789'
    }
    
    const result1 = signVote(input)
    const result2 = signVote(input)
    
    expect(result1.proofHash).toBe(result2.proofHash)
    expect(result1.proofHash).toMatch(/^[a-f0-9]{64}$/) // SHA256 hex string
  })

  it('should return different proofHash when optionId changes', () => {
    const input1 = {
      pollId: 'poll123',
      optionId: 'option456',
      voterProofId: 'voter789'
    }
    
    const input2 = {
      pollId: 'poll123',
      optionId: 'option999', // Different option
      voterProofId: 'voter789'
    }
    
    const result1 = signVote(input1)
    const result2 = signVote(input2)
    
    expect(result1.proofHash).not.toBe(result2.proofHash)
  })

  it('should return different proofHash when pollId changes', () => {
    const input1 = {
      pollId: 'poll123',
      optionId: 'option456',
      voterProofId: 'voter789'
    }
    
    const input2 = {
      pollId: 'poll999', // Different poll
      optionId: 'option456',
      voterProofId: 'voter789'
    }
    
    const result1 = signVote(input1)
    const result2 = signVote(input2)
    
    expect(result1.proofHash).not.toBe(result2.proofHash)
  })

  it('should return different proofHash when voterProofId changes', () => {
    const input1 = {
      pollId: 'poll123',
      optionId: 'option456',
      voterProofId: 'voter789'
    }
    
    const input2 = {
      pollId: 'poll123',
      optionId: 'option456',
      voterProofId: 'voter999' // Different voter
    }
    
    const result1 = signVote(input1)
    const result2 = signVote(input2)
    
    expect(result1.proofHash).not.toBe(result2.proofHash)
  })
})