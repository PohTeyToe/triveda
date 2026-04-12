/**
 * Cultural bonus weights and computation.
 *
 * All cuisines start at 0.08 (midpoint of the 0.05-0.10 band).
 * Individual weights can be overridden per cuisine code for future tuning.
 */

import { CUISINES } from '../cuisines/index.js';

/**
 * Base bonus weight per cuisine code.
 *
 * All cuisines get the same default weight. Per-cuisine overrides
 * can be added when food database coverage data is available.
 */
export const CULTURAL_BONUS_WEIGHTS: Record<string, number> = Object.fromEntries(
  CUISINES.map((c) => [c.code, 0.08]),
);

/**
 * Relationship multipliers for cultural bonus computation.
 */
const RELATIONSHIP_MULTIPLIERS: Record<string, number> = {
  native: 1.0,
  common: 1.0,
  fusion: 0.5,
  none: 0,
};

/**
 * Compute the cultural bonus for a single food-cuisine relationship.
 *
 * @param cuisineCode - The cuisine code (e.g., 'jamaican')
 * @param relationship - The food's relationship to the cuisine ('native', 'common', 'fusion', 'none')
 * @returns The weighted bonus value
 */
export function getCulturalBonus(cuisineCode: string, relationship: string): number {
  const baseWeight = CULTURAL_BONUS_WEIGHTS[cuisineCode] ?? 0;
  const multiplier = RELATIONSHIP_MULTIPLIERS[relationship] ?? 0;
  return baseWeight * multiplier;
}
