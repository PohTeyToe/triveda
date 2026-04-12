/**
 * Dislike filter -- removes foods the user has explicitly disliked.
 *
 * Matches food IDs against a list of disliked food IDs.
 *
 * Pure function, no IO.
 */

import type { FoodForScoring } from '../types.js';

/**
 * Filter out foods whose id appears in the dislikes list.
 *
 * @returns Foods whose id is NOT in the dislikes set.
 */
export function filterDislikes(foods: FoodForScoring[], dislikes: string[]): FoodForScoring[] {
  if (dislikes.length === 0) {
    return foods;
  }

  const dislikeSet = new Set(dislikes);
  return foods.filter((f) => !dislikeSet.has(f.id));
}
