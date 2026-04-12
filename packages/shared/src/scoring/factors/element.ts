/**
 * Element fit factor -- TCM five element compatibility.
 *
 * Weighted combination of food's affinity with the user's primary
 * and secondary constitutional elements (70/30 split).
 *
 * Pure function, no IO.
 */

import type { ConstitutionalProfile, FoodTCM, TCMElement } from '../types.js';
import { NEUTRAL_SCORE, PRIMARY_ELEMENT_WEIGHT, SECONDARY_ELEMENT_WEIGHT } from './constants.js';

/**
 * Compute element fit score for a food against the user's element profile.
 *
 * If the user has no primary element (fewer than 11 answers), returns
 * NEUTRAL_SCORE (0.5) as a safe fallback.
 *
 * @returns A number in [0, 1].
 */
export function elementFitScore(foodTCM: FoodTCM, profile: ConstitutionalProfile): number {
  if (profile.primaryElement === null) {
    return NEUTRAL_SCORE;
  }

  const primaryScore = foodTCM.elementFit[profile.primaryElement];
  // secondaryElement is always defined when primaryElement is non-null
  const secondaryScore = foodTCM.elementFit[profile.secondaryElement as TCMElement];

  return primaryScore * PRIMARY_ELEMENT_WEIGHT + secondaryScore * SECONDARY_ELEMENT_WEIGHT;
}
