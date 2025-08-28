/* SPDX-License-Identifier: (MIT OR MPL-2.0) */

import { VOTE_EMBEDDINGS } from "./embeddings";
import { DBT_CAP_TEMPORAL, DBT_WL, DBT_WT, DBT_REJECT_THRESHOLD } from "./config";

export type Verdict = "VALID" | "CAUTION" | "SUSPICIOUS" | "REJECT";

export function vdist(a: number[], b: number[]): number {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    s += (a[i] - b[i]) ** 2;
  }
  return Math.sqrt(s);
}

const FORBIDDEN: Record<string, Set<string>> = {
  "strongly-against": new Set(["strongly-support"]),
  "against":          new Set(["strongly-support"]),
  "support":          new Set(["strongly-against"]),
  "strongly-support": new Set(["strongly-against"]),
};

export function deltaLogic(prev?: string, next?: string): number {
  if (!next || !prev) return 0;
  return FORBIDDEN[prev]?.has(next) ? 1 : 0;
}

export function deltaTemporal(prev?: string, next?: string, CAP = DBT_CAP_TEMPORAL): number {
  if (!next || !prev) return 0;
  const a = VOTE_EMBEDDINGS[prev];
  const b = VOTE_EMBEDDINGS[next];
  if (!a || !b) return 0;
  return Math.min(1, vdist(a, b) / CAP);
}

export function divergence(dL: number, dT: number, wL = DBT_WL, wT = DBT_WT): number {
  return Math.sqrt(wL * dL * dL + wT * dT * dT);
}

export function verdictFrom(div: number, dL: number): Verdict {
  if (dL >= 1) return "REJECT";
  if (div > DBT_REJECT_THRESHOLD) return "REJECT";
  if (div > 0.65) return "SUSPICIOUS";
  if (div > 0.45) return "CAUTION";
  return "VALID";
}

export function updateIntegrity(prev?: number, div = 0, alpha = 0.2): number {
  const ew = prev === undefined ? div : (alpha * div + (1 - alpha) * (1 - prev));
  return Math.max(0, Math.min(1, 1 - ew));
}