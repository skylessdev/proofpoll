/* SPDX-License-Identifier: (MIT OR MPL-2.0) */

"use client";

interface TimelinePoint {
  t: number;
  div: number;
}

interface DbtTimelineProps {
  points: TimelinePoint[];
}

export default function DbtTimeline({ points }: DbtTimelineProps) {
  const w = 560, h = 120, p = 16;
  
  if (!points?.length) {
    return <div className="text-sm text-gray-500">No DBT data yet.</div>;
  }
  
  const xs = points.map(p => p.t);
  const ys = points.map(p => p.div);
  const minX = 1;
  const maxX = Math.max(...xs, 2);
  const minY = 0;
  const maxY = Math.max(...ys, 1);
  
  const X = (v: number) => p + (v - minX) / (maxX - minX) * (w - 2 * p);
  const Y = (v: number) => h - p - (v - minY) / (maxY - minY) * (h - 2 * p);
  
  const d = points.map((pt, i) => 
    `${i ? "L" : "M"}${X(pt.t)},${Y(pt.div)}`
  ).join(" ");
  
  return (
    <div className="space-y-2">
      <svg width={w} height={h} className="bg-gray-50 rounded border border-gray-200">
        <path d={d} fill="none" stroke="#111827" strokeWidth={2} />
        {/* Add threshold lines */}
        <line x1={p} y1={Y(0.45)} x2={w-p} y2={Y(0.45)} stroke="#fbbf24" strokeWidth={1} strokeDasharray="3,3" />
        <line x1={p} y1={Y(0.65)} x2={w-p} y2={Y(0.65)} stroke="#f59e0b" strokeWidth={1} strokeDasharray="3,3" />
        <line x1={p} y1={Y(0.85)} x2={w-p} y2={Y(0.85)} stroke="#ef4444" strokeWidth={1} strokeDasharray="3,3" />
      </svg>
      <div className="flex text-xs text-gray-500 space-x-4">
        <span className="flex items-center"><span className="w-3 h-px bg-yellow-400 mr-1"></span>Caution (0.45)</span>
        <span className="flex items-center"><span className="w-3 h-px bg-orange-500 mr-1"></span>Suspicious (0.65)</span>
        <span className="flex items-center"><span className="w-3 h-px bg-red-500 mr-1"></span>Reject (0.85)</span>
      </div>
    </div>
  );
}