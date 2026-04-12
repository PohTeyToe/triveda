/**
 * Scoring engine constants -- all numeric parameters for the scoring
 * algorithm live here. Frozen objects and primitive constants only.
 *
 * No IO, no side effects, no mutation.
 */

import type { TCMElement, ThermalNature } from '../engines/types.js';

// ---------------------------------------------------------------------------
// Factor weights (sum to 1.0)
// ---------------------------------------------------------------------------

export const FACTOR_WEIGHTS = Object.freeze({
  constitutional: 0.3,
  seasonal: 0.2,
  weather: 0.15,
  element: 0.15,
  antiRepetition: 0.12,
  organClock: 0.08,
} as const);

/** Names of all scoring factors */
export type FactorName = keyof typeof FACTOR_WEIGHTS;

// ---------------------------------------------------------------------------
// Thermal nature numeric values (TCM)
// ---------------------------------------------------------------------------

export const THERMAL_VALUES: Readonly<Record<ThermalNature, number>> = Object.freeze({
  cold: -1.0,
  cool: -0.5,
  neutral: 0.0,
  warm: 0.5,
  hot: 1.0,
});

// ---------------------------------------------------------------------------
// Anti-repetition decay steps
// ---------------------------------------------------------------------------

export interface DecayStep {
  readonly maxDays: number;
  readonly score: number;
}

export const DECAY_STEPS: readonly DecayStep[] = Object.freeze([
  Object.freeze({ maxDays: 1, score: 0.1 }), // suggested yesterday
  Object.freeze({ maxDays: 3, score: 0.4 }), // within 3 days
  Object.freeze({ maxDays: 7, score: 0.7 }), // within a week
  // Beyond 7 days: 1.0 (not recently suggested)
  // Rejected within HARD_REJECT_DAYS: 0.0
]);

/** Days within which a rejection blocks the food entirely */
export const HARD_REJECT_DAYS = 14;

// ---------------------------------------------------------------------------
// TCM generating cycle (Sheng cycle)
// ---------------------------------------------------------------------------

/** Maps each element to its "mother" -- the element that generates it */
export const GENERATING_CYCLE: Readonly<Record<TCMElement, TCMElement>> = Object.freeze({
  wood: 'water', // water generates wood
  fire: 'wood', // wood generates fire
  earth: 'fire', // fire generates earth
  metal: 'earth', // earth generates metal
  water: 'metal', // metal generates water
});

/** Food must have > this affinity for the mother element to score bonus */
export const GENERATING_ELEMENT_THRESHOLD = 0.6;

// ---------------------------------------------------------------------------
// Element scoring weights
// ---------------------------------------------------------------------------

/** Weight applied to primary element affinity */
export const PRIMARY_ELEMENT_WEIGHT = 0.7;

/** Weight applied to secondary element affinity */
export const SECONDARY_ELEMENT_WEIGHT = 0.3;

/** Neutral score (midpoint) */
export const NEUTRAL_SCORE = 0.5;

// ---------------------------------------------------------------------------
// Clamp bounds
// ---------------------------------------------------------------------------

/** Combined modifier clamp bounds */
export const MODIFIER_CLAMP = Object.freeze({ min: 0.8, max: 1.25 } as const);

/** Final score clamp bounds */
export const SCORE_CLAMP = Object.freeze({ min: 0, max: 1.2 } as const);
