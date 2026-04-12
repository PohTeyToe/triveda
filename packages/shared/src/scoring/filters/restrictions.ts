/**
 * Dietary restriction filter -- removes foods matching restricted tags.
 *
 * Common restriction tags: 'dairy', 'gluten', 'nightshade', 'meat',
 * 'egg', 'soy', 'shellfish', 'tree_nut', 'peanut', 'alcohol', 'caffeine'.
 *
 * Pure function, no IO.
 */

import type { FoodForScoring } from '../types.js';

/**
 * Filter out foods whose tags include any of the restriction strings.
 *
 * Uses a Set for O(1) restriction lookup per tag.
 *
 * @returns Foods that do NOT match any restriction.
 */
export function filterRestrictions(
  foods: FoodForScoring[],
  restrictions: string[],
): FoodForScoring[] {
  if (restrictions.length === 0) {
    return foods;
  }

  const restrictionSet = new Set(restrictions);
  return foods.filter((f) => !f.tags.some((tag) => restrictionSet.has(tag)));
}
