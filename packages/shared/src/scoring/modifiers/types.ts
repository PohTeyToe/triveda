/**
 * Modifier function type signatures.
 *
 * These are for documentation and type safety. The actual implementations
 * live in splits 10 and 11. The scoring package receives pre-computed
 * modifier values, so these signatures describe the computation that
 * happens upstream.
 *
 * The `unknown` parameter types are intentional -- the scoring package
 * does not know the shapes of BiomarkerProfile, CuisinePreferences, or
 * CheckInState. Those types are defined in their respective splits.
 */

import type { FoodForScoring } from '../types.js';

export type BloodWorkModifierFn = (food: FoodForScoring, biomarkerProfile: unknown) => number;

export type CulturalMatchModifierFn = (food: FoodForScoring, cuisines: unknown) => number;

export type DailyCheckInModifierFn = (food: FoodForScoring, checkInState: unknown) => number;
