/**
 * Top-N selection -- pick the top N scored foods.
 *
 * Assumes input is already sorted by scoreCandidates, but sorts
 * defensively if needed. Exists as a named export because downstream
 * consumers (backend API) call it explicitly after scoring.
 *
 * Pure function, no IO.
 */

import type { ScoredFood } from './types.js';

/**
 * Select the top N scored foods from a sorted array.
 *
 * If the input is not sorted, sorts first using the same comparator
 * as scoreCandidates (totalScore descending, foodId ascending for ties).
 *
 * Returns at most n items. If fewer items exist, returns all of them.
 */
export function selectTopN(scoredFoods: ScoredFood[], n: number): ScoredFood[] {
  if (scoredFoods.length === 0 || n <= 0) return [];

  // Defensive sort -- ensures correct order even if called standalone
  const sorted = [...scoredFoods].sort((a, b) => {
    const diff = b.totalScore - a.totalScore;
    if (diff !== 0) return diff;
    return a.foodId.localeCompare(b.foodId);
  });

  return sorted.slice(0, n);
}
