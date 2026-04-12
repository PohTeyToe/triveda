/**
 * Composite filter -- chains all hard-gate filters in sequence.
 *
 * Restriction filter runs first (broadest cut), then allergies, then dislikes.
 * Order does not affect correctness; all three are independent boolean exclusions.
 */

import type { FoodForScoring, ScoringContext } from '../types.js';
import { filterAllergies } from './allergies.js';
import { filterDislikes } from './dislikes.js';
import { filterRestrictions } from './restrictions.js';

/**
 * Apply all three candidate filters in sequence.
 *
 * @returns Foods that pass all filters.
 */
export function filterCandidates(
  foods: FoodForScoring[],
  context: ScoringContext,
): FoodForScoring[] {
  const afterRestrictions = filterRestrictions(foods, context.dietaryRestrictions);
  const afterAllergies = filterAllergies(afterRestrictions, context.allergies);
  return filterDislikes(afterAllergies, context.explicitDislikes);
}

// Re-export individual filters for direct use in testing
export { filterRestrictions } from './restrictions.js';
export { filterAllergies } from './allergies.js';
export { filterDislikes } from './dislikes.js';
