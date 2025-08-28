// app/dashboard/components/LiveConsensusMonitor.tsx - Real-time consensus monitoring
"use client";

import { useEffect, useState } from "react";

interface LiveMetric {
  pollId: string;
  question: string;
  divergence: number;
  verdict: string;
  voterId: string;
  timestamp: string;
}

interface AlertRule {
  id: string;
  name: string;
  condition: "high_divergence" | "flash_swing" | "verdict_spike";
  threshold: number;
  active: boolean;
}

function AlertBadge({ type, message }: { type: "warning" | "critical"; message: string }) {
  const colors = {
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    critical: "bg-red-50 border-red-200 text-red-800"
  };
  
  return (
    <div className={`border rounded-lg p-3 ${colors[type]}`}>
      <div className="flex items-center">
        <div className={`w-2 h-2 rounded-full mr-2 ${type === 'critical' ? 'bg-red-500' : 'bg-yellow-500'}`} />
        <span className="font-medium text-sm">{message}</span>
      </div>
    </div>
  );
}

function ConsensusHealthIndicator({ strength }: { strength: number }) {
  const getColor = (s: number) => {
    if (s >= 0.8) return "text-green-600 bg-green-100";
    if (s >= 0.6) return "text-yellow-600 bg-yellow-100";
    if (s >= 0.4) return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
  };
  
  const getStatus = (s: number) => {
    if (s >= 0.8) return "Strong";
    if (s >= 0.6) return "Moderate";
    if (s >= 0.4) return "Weak";
    return "Critical";
  };
  
  return (
    <div className="flex items-center space-x-2">
      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getColor(strength)}`}>
        {getStatus(strength)}
      </div>
      <span className="text-sm text-gray-600">
        {(strength * 100).toFixed(1)}%
      </span>
    </div>
  );
}

export default function LiveConsensusMonitor() {
  const [liveMetrics, setLiveMetrics] = useState<LiveMetric[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [consensusHealth, setConsensusHealth] = useState(0.85);
  const [isConnected, setIsConnected] = useState(false);

  const alertRules: AlertRule[] = [
    {
      id: "high_div",
      name: "High Divergence Spike",
      condition: "high_divergence",
      threshold: 0.8,
      active: true
    },
    {
      id: "flash_swing",
      name: "Flash Vote Swing",
      condition: "flash_swing",
      threshold: 5, // 5+ votes in 1 minute
      active: true
    },
    {
      id: "reject_spike",
      name: "REJECT Verdict Spike",
      condition: "verdict_spike",
      threshold: 0.3, // 30% reject rate
      active: true
    }
  ];

  useEffect(() => {
    // Simulate real-time updates (in production, this would be WebSocket/SSE)
    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/dbt/metrics?limit=5");
        if (response.ok) {
          const metrics = await response.json();
          const liveData: LiveMetric[] = metrics.map((m: any) => ({
            pollId: m.pollId,
            question: m.poll.question,
            divergence: m.divergence,
            verdict: m.verdict,
            voterId: m.voterId,
            timestamp: m.createdAt
          }));
          
          setLiveMetrics(liveData);
          setIsConnected(true);
          
          // Calculate current consensus health
          const avgDivergence = liveData.length > 0 
            ? liveData.reduce((sum, m) => sum + m.divergence, 0) / liveData.length
            : 0;
          setConsensusHealth(Math.max(0, 1 - avgDivergence));
          
          // Check alert conditions
          checkAlerts(liveData);
        }
      } catch (error) {
        console.error("Failed to fetch live metrics:", error);
        setIsConnecte