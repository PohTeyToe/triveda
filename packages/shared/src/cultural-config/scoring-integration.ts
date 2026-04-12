/**
 * Cultural bonus scoring integration.
 *
 * Called by the scoring engine to compute the total cultural bonus for
 * a food based on the user's cuisine preferences and the food's cultural entries.
 *
 * Multi-cuisine cap: total bonus is capped at 0.10 regardless of how many
 * cuisines match. Cultural matching is a soft nudge, not a hard signal.
 */

import { getCulturalBonus } from './index.js';

/**
 * Compute the aggregate cultural bonus for a food.
 *
 * @param userCuisines - Array of cuisine codes from the user's profile
 * @param foodCuisines - Array of cuisine/relationship entries from the food's data
 * @returns Total bonus (capped at 0.10) and list of matched cuisine codes
 */
export function computeCulturalBonus(
  userCuisines: string[],
  foodCuisines: Array<{ cuisine_code: string; relationship: string }>,
): { bonus: number; matchedCuisines: string[] } {
  let totalBonus = 0;
  const matchedCuisines: string[] = [];

  for (const userCuisine of userCuisines) {
    const foodEntry = foodCuisines.find((fc) => fc.cuisine_code === userCuisine);
    if (foodEntry) {
      const bonus = getCulturalBonus(userCuisine, foodEntry.relationship);
      totalBonus += bonus;
      matchedCuisines.push(userCuisine);
    }
  }

  // Cap at 0.10 -- cultural matching stays small regardless of match count
  totalBonus = Math.min(totalBonus, 0.1);

  return { bonus: totalBonus, matchedCuisines };
}
