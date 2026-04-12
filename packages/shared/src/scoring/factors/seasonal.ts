/**
 * Seasonal factor -- Ayurvedic ritu fit for the current season.
 *
 * Handles season transitions via linear blending and applies a
 * latitude-based intensity dampener from split 02's season engine.
 *
 * Pure function, no IO.
 */

import type { FoodAyurveda, SeasonalContext } from '../types.js';

/**
 * Compute seasonal score for a food given the current seasonal context.
 *
 * During transitions, blends the outgoing and incoming ritu scores
 * according to transitionProgress. Multiplies by seasonalIntensity
 * (0.3-1.0) to dampen seasonal influence near the equator.
 *
 * @returns A number in [0, 1].
 */
export function seasonalScore(foodAyurveda: FoodAyurveda, seasonal: SeasonalContext): number {
  let score: number;

  if (seasonal.isTransition && seasonal.adjacentRitu !== undefined) {
    const outgoingWeight = 1.0 - seasonal.transitionProgress;
    const incomingWeight = seasonal.transitionProgress;
    score =
      outgoingWeight * foodAyurveda.rituFit[seasonal.ayurvedaRitu] +
      incomingWeight * foodAyurveda.rituFit[seasonal.adjacentRitu];
  } else {
    score = foodAyurveda.rituFit[seasonal.ayurvedaRitu];
  }

  return score * seasonal.seasonalIntensity;
}
