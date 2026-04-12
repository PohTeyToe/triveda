/**
 * Allergy filter -- removes foods matching allergens in tags or contraindications.
 *
 * Checks both the food's tags array and optional contraindications array
 * for allergen matches. Either match is grounds for exclusion.
 *
 * Pure function, no IO.
 */

import type { FoodForScoring } from '../types.js';

/**
 * Filter out foods where tags or contraindications match any allergy.
 *
 * The contraindications field is optional (string[] | undefined).
 * Optional chaining with nullish coalescing handles both undefined
 * and empty arrays.
 *
 * @returns Foods that do NOT match any allergy.
 */
export function filterAllergies(foods: FoodForScoring[], allergies: string[]): FoodForScoring[] {
  if (allergies.length === 0) {
    return foods;
  }

  const allergySet = new Set(allergies);
  return foods.filter((f) => {
    const tagMatch = f.tags.some((t) => allergySet.has(t));
    const contrMatch = f.contraindications?.some((c) => allergySet.has(c)) ?? false;
    return !tagMatch && !contrMatch;
  });
}
