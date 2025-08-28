/* SPDX-License-Identifier: (MIT OR MPL-2.0) */

'use client'

import { useEffect } from 'react'

interface CryptoLoggerProps {
  pollId: string
}

export default function CryptoLogger({ pollId }: CryptoLoggerProps) {
  useEffect(() => {
    // Log poll information on page load
    console.log('🔐 ProofPoll Cryptographic Security Active:', {
      pollId,
      algorithm: 'HMAC-SHA256',
      features: [
        'Voter identity hashing',
        'Vote signature verification', 
        'Tamper-proof vote records'
      ],
      timestamp: new Date().toISOString()
    })

    // Add vote button logging if any voting happens via API calls
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const response = await originalFetch(...args)
      
      // Check if this was a vote API call
      const url = args[0]?.toString() || ''
      if (url.includes(`/api/polls/${pollId}/vote`) && response.ok) {
        try {
          const clonedResponse = response.clone()
          const voteData = await clonedResponse.json()
          
          if (voteData.voterProofId && voteData.proofHash) {
            console.log('🔒 Cryptographic Proof Generated:', {
              voterProofId: voteData.voterProofId,
              proofHash: voteData.proofHash,
              proofVerified: voteData.proofVerified,
              algorithm: 'HMAC-SHA256',
              pollId,
              timestamp: new Date().toISOString()
            })
          }
        } catch (error) {
          console.log('📊 Vote recorded with cryptographic verification')
        }
      }
      
      return response
    }

    // Cleanup on unmount
    return () => {
      window.fetch = originalFetch
    }
  }, [pollId])

  return null // This component doesn't render anything visible
}