/**
 * Telemetry -- observability data for scoring runs.
 *
 * Produces a ScoringTelemetry object per scoring call with
 * performance metrics and summary data for request logging.
 *
 * Pure function, no IO. The durationMs parameter is measured
 * by the caller using performance.now().
 */

import type { FoodForScoring, ScoredFood, ScoringTelemetry } from './types.js';

/**
 * Build a ScoringTelemetry object for a completed scoring run.
 *
 * @param foods - The original input food array.
 * @param scoredFoods - The scored output array (assumed sorted).
 * @param filteredCount - Number of foods filtered out (foods.length - eligible.length).
 * @param durationMs - Time taken for the scoring run, from the caller.
 * @returns A JSON-serializable ScoringTelemetry object.
 */
export function buildTelemetry(
  foods: FoodForScoring[],
  scoredFoods: ScoredFood[],
  filteredCount: number,
  durationMs: number,
): ScoringTelemetry {
  const foodCount = foods.length;
  const scoredCount = scoredFoods.length;
  const first = scoredFoods.length > 0 ? scoredFoods[0] : undefined;
  const last = scoredFoods.length > 0 ? scoredFoods[scoredFoods.length - 1] : undefined;
  const topScore = first?.totalScore ?? 0;
  const bottomScore = last?.totalScore ?? 0;

  // Count active credits from the top-scored food
  const activeCreditsCount = first ? first.credits.filter((c) => c.active).length : 0;

  // Lightweight correlation key (not cryptographic, just deterministic)
  const inputsHash = `${foodCount}|${scoredFoods[0]?.totalScore ?? 0}|${durationMs}`;

  return {
    inputsHash,
    durationMs,
    foodCount,
    filteredCount,
    scoredCount,
    topScore,
    bottomScore,
    activeCreditsCount,
  };
}
