/* SPDX-License-Identifier: (MIT OR MPL-2.0) */

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import CryptoLogger from './components/CryptoLogger'
import DbtTimeline from './components/DbtTimeline'
import DbtIntegrityTable from './components/DbtIntegrityTable'
import { createDb } from '@/lib/db'
import { DBT_ENABLED } from '@/lib/dbt/config'

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

async function getDbtSummary(pollId: string, baseUrl: string) {
  if (!DBT_ENABLED) return { points: [], avg: 0, count: 0 };
  
  try {
    const res = await fetch(`${baseUrl}/api/polls/${pollId}/dbt/summary`, { 
      cache: "no-store" 
    });
    if (!res.ok) return { points: [], avg: 0, count: 0 };
    return res.json();
  } catch {
    return { points: [], avg: 0, count: 0 };
  }
}

async function getDbtIntegrityRows(pollId: string) {
  if (!DBT_ENABLED) return [];
  
  try {
    const db = createDb();
    const scope = `poll:${pollId}`;
    const rows = await db.$queryRaw<{
      voterId: string; 
      integrity: number; 
      interactionCount: number; 
      avgDivergence: number;
    }[]>`
      SELECT "voterId", "integrity", "interactionCount", "avgDivergence"
      FROM "DbtIntegrity" 
      WHERE "scope" = ${scope}
      ORDER BY "integrity" ASC
    `;
    await db.$disconnect();
    return rows;
  } catch {
    return [];
  }
}

export default async function PollResultsPage({ params }: { params: Promise<{ id: string }> }) {
  // Await params and headers for Next.js 15
  const { id } = await params
  const h = await headers()
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const baseUrl = `${proto}://${host}`
  
  // Fetch poll data and DBT data in parallel
  let poll: Poll;
  let dbtSummary: { points: any[], avg: number, count: number };
  let dbtIntegrityRows: any[];
  
  try {
    const [pollResponse, dbtSummaryData, dbtIntegrityData] = await Promise.all([
      fetch(`${baseUrl}/api/polls/${id}`, { cache: 'no-store' }),
      getDbtSummary(id, baseUrl),
      getDbtIntegrityRows(id)
    ]);
    
    if (!pollResponse.ok) {
      notFound();
    }
    
    poll = await pollResponse.json();
    dbtSummary = dbtSummaryData;
    dbtIntegrityRows = dbtIntegrityData;
  } catch (error) {
    console.error('Failed to fetch poll data:', error);
    notFound();
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
        
        {/* DBT Consensus Analysis */}
        {DBT_ENABLED && (
          <div className="mt-6 space-y-4">
            <section className="border border-gray-200 rounded-xl p-4 bg-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">DBT Consensus Analysis</h3>
                <div className="text-xs text-gray-600">
                  avg divergence: {dbtSummary.avg?.toFixed?.(3) ?? "0.000"} • votes: {dbtSummary.count ?? 0}
                </div>
              </div>
              <DbtTimeline points={dbtSummary.points || []} />
              <div className="mt-2 text-xs text-gray-500">
                Tracks voting pattern divergence over time using dual-baseline telemetry
              </div>
            </section>
            
            <section className="border border-gray-200 rounded-xl p-4 bg-white">
              <h3 className="font-medium text-gray-900 mb-3">Voter Integrity Metrics</h3>
              <DbtIntegrityTable rows={dbtIntegrityRows} />
              <div className="mt-2 text-xs text-gray-500">
                Integrity scores based on voting pattern consistency (scope: poll)
              </div>
            </section>
          </div>
        )}
        
        {/* Add crypto logging component */}
        <CryptoLogger pollId={poll.id} />
      </div>
    </div>
  )
}