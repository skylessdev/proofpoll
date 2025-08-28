/* SPDX-License-Identifier: (MIT OR MPL-2.0) */

"use client";

interface IntegrityRow {
  voterId: string;
  integrity: number;
  interactionCount: number;
  avgDivergence: number;
}

interface DbtIntegrityTableProps {
  rows: IntegrityRow[];
}

export default function DbtIntegrityTable({ rows }: DbtIntegrityTableProps) {
  if (!rows?.length) {
    return <div className="text-sm text-gray-500">No integrity records yet.</div>;
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border border-gray-200 rounded overflow-hidden">
        <thead className="bg-gray-50 text-gray-700">
          <tr>
            <th className="text-left p-2 border-b">Voter</th>
            <th className="text-right p-2 border-b">Integrity</th>
            <th className="text-right p-2 border-b">Interactions</th>
            <th className="text-right p-2 border-b">Avg Δ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const integrityColor = r.integrity > 0.7 ? 'text-green-600' : 
                                 r.integrity > 0.4 ? 'text-yellow-600' : 'text-red-600';
            return (
              <tr key={r.voterId} className="border-t hover:bg-gray-50">
                <td className="p-2 font-mono text-xs">{r.voterId.substring(0, 8)}...</td>
                <td className={`p-2 text-right font-medium ${integrityColor}`}>
                  {r.integrity.toFixed(3)}
                </td>
                <td className="p-2 text-right">{r.interactionCount}</td>
                <td className="p-2 text-right">{r.avgDivergence.toFixed(3)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}