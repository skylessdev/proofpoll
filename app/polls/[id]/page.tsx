/* SPDX-License-Identifier: (MIT OR MPL-2.0) */

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'

interface Poll {
  id: string
  question: string
  createdAt: string
  options: Array<{
    id: string
    label: string
    count: number
  }>
}

export default async function PollResultsPage({ params }: { params: Promise<{ id: string }> }) {
  // Await params and headers for Next.js 15
  const { id } = await params
  const h = await headers()
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const baseUrl = `${proto}://${host}`
  
  // Fetch poll data
  let poll: Poll
  try {
    const response = await fetch(`${baseUrl}/api/polls/${id}`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      notFound()
    }
    
    poll = await response.json()
  } catch (error) {
    console.error('Failed to fetch poll:', error)
    notFound()
  }
  
  // Calculate total votes for percentages
  const totalVotes = poll.options.reduce((sum, option) => sum + option.count, 0)
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {poll.question}
          </h1>
          
          <div className="space-y-4">
            {poll.options.map((option) => {
              const percentage = totalVotes > 0 ? (option.count / totalVotes) * 100 : 0
              
              return (
                <div key={option.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">{option.label}</span>
                    <span className="text-sm text-gray-600">
                      {option.count} vote{option.count !== 1 ? 's' : ''} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Total votes: {totalVotes} • Last updated just now
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}