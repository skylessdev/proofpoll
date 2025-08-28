/* SPDX-License-Identifier: (MIT OR MPL-2.0) */

export const VOTE_EMBEDDINGS: Record<string, number[]> = {
  "strongly-against": [-2, -1, 0.1],
  "against":          [-1, -0.5, 0.3],
  "neutral":          [ 0,  0,   0.5],
  "support":          [ 1,  0.5, 0.7],
  "strongly-support": [ 2,  1,   0.9],
};