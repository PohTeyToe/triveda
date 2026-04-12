/**
 * Scoring engine types -- pure type definitions, no runtime logic.
 *
 * The scoring engine uses camelCase interfaces. A mapper in split 06
 * converts snake_case DB rows to these interfaces.
 *
 * Imports engine context types from split 02 and CreditSource from
 * split 01. No imports from packages/db.
 */

import type { CreditSource } from '../credits.js';
import type {
  ConstitutionalProfile,
  DoshaProfile,
  OrganClockContext,
  Ritu,
  SeasonalContext,
  TCMElement,
  WeatherContext,
} from '../engines/types.js';

// Re-export imported types used in scoring interfaces so consumers
// can import everything from the scoring barrel.
export type {
  ConstitutionalProfile,
  DoshaProfile,
  Ritu,
  TCMElement,
  SeasonalContext,
  WeatherContext,
  OrganClockContext,
  CreditSource,
};

// ---------------------------------------------------------------------------
// String unions
// ---------------------------------------------------------------------------

/** Ayurvedic dosha type (local alias for scoring context) */
export type Dosha = 'vata' | 'pitta' | 'kapha';

/** TCM thermal nature of a food */
export type ThermalNature = 'hot' | 'warm' | 'neutral' | 'cool' | 'cold';

/** Credit contribution status */
export type Contribution = 'active' | 'latent' | 'future';

// ---------------------------------------------------------------------------
// Input types -- scoring engine's view of a food
// ---------------------------------------------------------------------------

/** Ayurvedic properties needed for scoring */
export interface FoodAyurveda {
  vataEffect: number; // -2 to +2, negative = pacifies
  pittaEffect: number; // -2 to +2
  kaphaEffect: number; // -2 to +2
  rituFit: Record<Ritu, number>; // 0.0-1.0 fit per season
}

/** TCM properties needed for scoring */
export interface FoodTCM {
  thermalNature: ThermalNature;
  organAffinity: string[]; // e.g. 'stomach', 'liver', 'lung'
  elementFit: Record<TCMElement, number>; // 0.0-1.0 per element
}

/** The scoring engine's view of a food -- decoupled from DB schema */
export interface FoodForScoring {
  id: string;
  name: string;
  tags: string[]; // 'dairy', 'gluten', 'nightshade', 'meat'
  contraindications: string[] | undefined;
  ayurveda: FoodAyurveda;
  tcm: FoodTCM;
}

/** Food interaction history entry */
export interface FoodFeedback {
  foodId: string;
  date: string; // ISO YYYY-MM-DD
  response: 'accepted' | 'rejected' | 'ignored';
}

/** Pre-computed modifier values passed to scoring */
export interface ModifierValues {
  bloodWork: number | undefined; // [0.8, 1.2] when provided
  culturalMatch: number | undefined; // [1.0, 1.1] when provided
  dailyCheckIn: number | undefined; // [0.9, 1.1] when provided
}

/** Everything the scoring engine needs beyond foods and profile */
export interface ScoringContext {
  seasonal: SeasonalContext;
  weather: WeatherContext;
  organClock: OrganClockContext;
  recentFoods: FoodFeedback[];
  dietaryRestrictions: string[];
  allergies: string[];
  explicitDislikes: string[];
  today: string; // ISO YYYY-MM-DD
}

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

/** Detail for a single scoring factor */
export interface FactorDetail {
  weight: number; // locked factor weight
  rawScore: number; // 0-1
  weightedScore: number; // weight * rawScore
  rationale: string; // human-readable template
}

/** Breakdown of all 6 scoring factors */
export interface FactorBreakdown {
  constitutional: FactorDetail;
  seasonal: FactorDetail;
  weather: FactorDetail;
  element: FactorDetail;
  antiRepetition: FactorDetail;
  organClock: FactorDetail;
}

/** Result of a single modifier application */
export interface ModifierResult {
  name: string;
  value: number; // the multiplier
  applied: boolean;
  rationale: string;
}

/** Per-food scoring result */
export interface ScoredFood {
  foodId: string;
  foodName: string;
  totalScore: number; // 0 to 1.2, after modifiers
  baseScore: number; // 0 to 1.0, before modifiers
  breakdown: FactorBreakdown;
  modifiers: ModifierResult[];
  credits: CreditSource[]; // always length 22
}

/** Debug output from explainScore */
export interface ScoreBreakdown {
  foodId: string;
  foodName: string;
  totalScore: number;
  baseScore: number;
  factors: Array<{
    name: string;
    weight: number;
    rawScore: number;
    weightedScore: number;
    attribution: number; // weight * (rawScore - 0.5), signed delta
    rationale: string;
  }>;
  modifiers: Array<{
    name: string;
    value: number;
    applied: boolean;
    rationale: string;
  }>;
  credits: CreditSource[];
}

/** Telemetry for a scoring run */
export interface ScoringTelemetry {
  inputsHash: string;
  durationMs: number;
  foodCount: number;
  filteredCount: number;
  scoredCount: number;
  topScore: number;
  bottomScore: number;
  activeCreditsCount: number;
}
