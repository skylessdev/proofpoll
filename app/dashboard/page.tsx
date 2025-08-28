/* SPDX-License-Identifier: (MIT OR MPL-2.0) */

"use client";

import { useEffect, useState } from "react";

interface DbtVoteMetric {
  id: string;
  pollId: string;
  voterId: string;
  deltaLogic: number;
  deltaTemporal: number;
  divergence: number;
  verdict: "VALID" | "CAUTION" | "SUSPICIOUS" | "REJECT";
  reasons: string[];
  createdAt: string;
  poll: {
    question: string;
  };
}

interface DbtIntegrity {
  voterId: string;
  scope: string;
  integrity: number;
  interactionCount: number;
  avgDivergence: number;
}

interface ConsensusPoint {
  timestamp: string;
  avgDivergence: number;
  voteCount: number;
  pollId: string;
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const colors = {
    VALID: "bg-green-50 text-green-800 border-green-200",
    CAUTION: "bg-yellow-50 text-yellow-800 border-yellow-200",
    SUSPICIOUS: "bg-orange-50 text-orange-800 border-orange-200",
    REJECT: "bg-red-50 text-red-800 border-red-200",
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${colors[verdict as keyof typeof colors] || colors.VALID}`}>
      {verdict}
    </span>
  );
}

function MetricBar({ label, value, max = 1, color = "bg-blue-500" }: { 
  label: string; 
  value: number; 
  max?: number; 
  color?: string; 
}) {
  const percentage = Math.min(100, (value / max) * 100);
  
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-500">{value.toFixed(3)}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function ConsensusTimeline({ data }: { data: ConsensusPoint[] }) {
  if (!data.length) return <div className="text-gray-500">No consensus data available</div>;
  
  const maxDivergence = Math.max(...data.map(d => d.avgDivergence));
  
  return (
    <div className="space-y-2">
      {data.map((point, i) => (
        <div key={i} className="flex items-center space-x-3">
          <div className="text-xs text-gray-500 w-16">
            {new Date(point.timestamp).toLocaleTimeString()}
          </div>
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 rounded-full bg-red-500"
              style={{ width: `${(point.avgDivergence / maxDivergence) * 100}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 w-12">
            {point.voteCount}v
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DBTDashboard() {
  const [metrics, setMetrics] = useState<DbtVoteMetric[]>([]);
  const [integrity, setIntegrity] = useState<DbtIntegrity[]>([]);
  const [consensus, setConsensus] = useState<ConsensusPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoll, setSelectedPoll] = useState<string>("");

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  async function fetchDashboardData() {
    try {
      const [metricsRes, integrityRes, consensusRes] = await Promise.all([
        fetch("/api/dbt/metrics"),
        fetch("/api/dbt/integrity"),
        fetch("/api/dbt/consensus"),
      ]);

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      }

      if (integrityRes.ok) {
        const integrityData = await integrityRes.json();
        setIntegrity(integrityData);
      }

      if (consensusRes.ok) {
        const consensusData = await consensusRes.json();
        setConsensus(consensusData);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredMetrics = selectedPoll 
    ? metrics.filter(m => m.pollId === selectedPoll)
    : metrics;

  const avgDivergence = filteredMetrics.length 
    ? filteredMetrics.reduce((sum, m) => sum + m.divergence, 0) / filteredMetrics.length
    : 0;

  const verdictCounts = filteredMetrics.reduce((acc, m) => {
    acc[m.verdict] = (acc[m.verdict] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topVotersByIntegrity = Array.from(integrity)
    .sort((a, b) => b.integrity - a.integrity)
    .slice(0, 10);

  const uniquePolls = Array.from(new Set(metrics.map(m => m.pollId)));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading DBT Analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Dual-Baseline Telemetry Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Real-time consensus measurement and voter integrity analysis
          </p>
        </div>

        {/* Poll Filter */}
        <div className="mb-6">
          <select
            value={selectedPoll}
            onChange={(e) => setSelectedPoll(e.target.value)}
            className="block w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Polls</option>
            {uniquePolls.map(pollId => (
              <option key={pollId} value={pollId}>
                Poll {pollId.slice(-8)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary Statistics */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Consensus Health
              </h2>
              
              <MetricBar 
                label="Average Divergence" 
                value={avgDivergence}
                max={1}
                color={avgDivergence > 0.6 ? "bg-red-500" : avgDivergence > 0.3 ? "bg-yellow-500" : "bg-green-500"}
              />
              
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  Total Votes Analyzed: {filteredMetrics.length}
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(verdictCounts).map(([verdict, count]) => (
                    <div key={verdict} className="flex items-center space-x-1">
                      <VerdictBadge verdict={verdict} />
                      <span className="text-sm text-gray-500">({count})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Voters by Integrity */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Voter Integrity Leaderboard
              </h2>
              
              <div className="space-y-3">
                {topVotersByIntegrity.slice(0, 5).map((voter, i) => (
                  <div key={voter.voterId} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        i === 0 ? "bg-yellow-100 text-yellow-800" :
                        i === 1 ? "bg-gray-100 text-gray-800" :
                        i === 2 ? "bg-orange-100 text-orange-800" :
                        "bg-blue-100 text-blue-800"
                      }`}>
                        {i + 1}
                      </div>
                      <span className="text-sm text-gray-700">
                        {voter.voterId.slice(-8)}...
                      </span>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {voter.integrity.toFixed(3)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Vote Analysis */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Vote Analysis
              </h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Time
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Voter
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Δ Logic
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Δ Temporal
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Divergence
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Verdict
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredMetrics.slice(-20).reverse().map((metric) => (
                      <tr key={metric.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {new Date(metric.createdAt).toLocaleTimeString()}
                        </td>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">
                          {metric.voterId.slice(-8)}...
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {metric.deltaLogic.toFixed(3)}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {metric.deltaTemporal.toFixed(3)}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {metric.divergence.toFixed(3)}
                        </td>
                        <td className="px-4 py-2">
                          <VerdictBadge verdict={metric.verdict} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Consensus Timeline */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Consensus Evolution
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Average divergence over time (red intensity = higher divergence)
              </p>
              <ConsensusTimeline data={consensus.slice(-20)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}