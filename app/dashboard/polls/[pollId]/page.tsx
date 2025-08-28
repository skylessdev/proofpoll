/* SPDX-License-Identifier: (MIT OR MPL-2.0) */

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface PollAnalysis {
  poll: {
    id: string;
    question: string;
    createdAt: string;
  };
  options: Array<{
    id: string;
    label: string;
    voteCount: number;
  }>;
  consensus: {
    totalVotes: number;
    averageDivergence: number;
    verdictDistribution: Record<string, number>;
    timeline: Array<{
      timestamp: string;
      divergence: number;
      cumulativeAvg: number;
    }>;
    consensusStrength: number;
  };
  voters: {
    total: number;
    highIntegrity: number;
    suspicious: number;
  };
}

function ConsensusEvolutionChart({ timeline }: { timeline: Array<{ timestamp: string; divergence: number; cumulativeAvg: number }> }) {
  if (!timeline.length) return <div className="text-gray-500">No timeline data available</div>;

  const maxDivergence = Math.max(...timeline.map(t => Math.max(t.divergence, t.cumulativeAvg)));
  
  return (
    <div className="h-64 relative">
      <svg className="w-full h-full" viewBox="0 0 800 200">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(y => (
          <line
            key={y}
            x1={0}
            y1={200 - (y * 200)}
            x2={800}
            y2={200 - (y * 200)}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}
        
        {/* Individual vote divergence (dots) */}
        {timeline.map((point, i) => {
          const x = (i / (timeline.length - 1)) * 800;
          const y = 200 - (point.divergence / maxDivergence) * 200;
          return (
            <circle
              key={`vote-${i}`}
              cx={x}
              cy={y}
              r="3"
              fill={point.divergence > 0.8 ? "#dc2626" : point.divergence > 0.6 ? "#ea580c" : point.divergence > 0.4 ? "#ca8a04" : "#16a34a"}
              opacity="0.6"
            />
          );
        })}
        
        {/* Cumulative average (line) */}
        <polyline
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          points={timeline.map((point, i) => {
            const x = (i / (timeline.length - 1)) * 800;
            const y = 200 - (point.cumulativeAvg / maxDivergence) * 200;
            return `${x},${y}`;
          }).join(' ')}
        />
      </svg>
      
      {/* Legend */}
      <div className="absolute bottom-2 left-2 text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded"></div>
            <span>Cumulative Average</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded"></div>
            <span>Low Divergence</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-red-500 rounded"></div>
            <span>High Divergence</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function VotingPatternAnalysis({ options, verdictDistribution, totalVotes }: {
  options: Array<{ id: string; label: string; voteCount: number }>;
  verdictDistribution: Record<string, number>;
  totalVotes: number;
}) {
  const totalOptions = options.reduce((sum, opt) => sum + opt.voteCount, 0);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Vote Distribution */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Vote Distribution</h3>
        <div className="space-y-3">
          {options.map(option => {
            const percentage = totalOptions > 0 ? (option.voteCount / totalOptions) * 100 : 0;
            return (
              <div key={option.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{option.label}</span>
                    <span className="text-sm text-gray-500">
                      {option.voteCount} votes ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Verdict Distribution */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Consensus Quality</h3>
        <div className="space-y-3">
          {Object.entries(verdictDistribution).map(([verdict, count]) => {
            const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
            const colors = {
              VALID: "bg-green-500",
              CAUTION: "bg-yellow-500",
              SUSPICIOUS: "bg-orange-500",
              REJECT: "bg-red-500"
            };
            
            return (
              <div key={verdict} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{verdict}</span>
                    <span className="text-sm text-gray-500">
                      {count} votes ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${colors[verdict as keyof typeof colors] || 'bg-gray-500'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function PollAnalysisPage() {
  const params = useParams();
  const pollId = params?.pollId as string;
  const [analysis, setAnalysis] = useState<PollAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pollId) return;
    
    fetchPollAnalysis();
  }, [pollId]);

  async function fetchPollAnalysis() {
    try {
      setLoading(true);
      const response = await fetch(`/api/dbt/polls/${pollId}/analysis`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch poll analysis');
      }
      
      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading poll analysis...</div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-2">Error loading poll analysis</div>
          <div className="text-gray-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="text-sm breadcrumb mb-4">
            <Link href="/dashboard" className="text-blue-600 hover:underline">Dashboard</Link>
            <span className="mx-2 text-gray-500">/</span>
            <span className="text-gray-700">Poll Analysis</span>
          </nav>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Poll Analysis
          </h1>
          <div className="bg-white rounded-lg p-4 shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {analysis.poll.question}
            </h2>
            <div className="text-sm text-gray-500">
              Created: {new Date(analysis.poll.createdAt).toLocaleString()} • 
              Poll ID: {analysis.poll.id}
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">{analysis.consensus.totalVotes}</div>
            <div className="text-sm text-gray-500">Total Votes</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-blue-600">
              {(analysis.consensus.consensusStrength * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">Consensus Strength</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">{analysis.voters.total}</div>
            <div className="text-sm text-gray-500">Unique Voters</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-orange-600">
              {analysis.consensus.averageDivergence.toFixed(3)}
            </div>
            <div className="text-sm text-gray-500">Avg Divergence</div>
          </div>
        </div>

        {/* Consensus Evolution Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Consensus Evolution Over Time
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Each dot represents a vote's divergence. The blue line shows cumulative average.
          </p>
          <ConsensusEvolutionChart timeline={analysis.consensus.timeline} />
        </div>

        {/* Voting Patterns */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Voting Patterns & Quality Analysis
          </h2>
          <VotingPatternAnalysis 
            options={analysis.options}
            verdictDistribution={analysis.consensus.verdictDistribution}
            totalVotes={analysis.consensus.totalVotes}
          />
        </div>

        {/* Voter Analysis */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Voter Behavior Analysis
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {analysis.voters.highIntegrity}
              </div>
              <div className="text-sm text-gray-500">High Integrity Votes</div>
              <div className="text-xs text-gray-400">(Low divergence pattern)</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {analysis.voters.suspicious}
              </div>
              <div className="text-sm text-gray-500">Suspicious Votes</div>
              <div className="text-xs text-gray-400">(High divergence or flagged)</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {((analysis.voters.highIntegrity / analysis.consensus.totalVotes) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Integrity Rate</div>
              <div className="text-xs text-gray-400">(High integrity / total votes)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}