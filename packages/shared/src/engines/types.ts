/**
 * Deterministic engine types, Zod input schemas, and result wrappers.
 *
 * All types use camelCase field names (idiomatic TS). The API layer
 * (split 06) maps snake_case DB rows to camelCase before passing
 * them to engines.
 *
 * No IO or side effects -- pure type definitions.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enums / String Unions
// ---------------------------------------------------------------------------

/** Ayurvedic dosha type */
export type Dosha = 'vata' | 'pitta' | 'kapha';

/** Ayurvedic season (Ritu) */
export type Ritu = 'shishira' | 'vasanta' | 'grishma' | 'varsha' | 'sharad' | 'hemanta';

/**
 * TCM seasonal phase. Same string values as TCMElement but represents
 * the seasonal cycle (Wood/Spring, Fire/Summer, etc.).
 */
export type TCMPhase = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

/** TCM constitutional element type */
export type TCMElement = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

/** Naturopathy metabolic type */
export type MetabolicType = 'fast_oxidizer' | 'slow_oxidizer' | 'mixed_oxidizer';

/** Autonomic nervous system dominance */
export type ANSDominance = 'sympathetic' | 'parasympathetic' | 'balanced';

/** TCM thermal nature of a food */
export type ThermalNature = 'hot' | 'warm' | 'neutral' | 'cool' | 'cold';

/** Ayurvedic virya (potency) */
export type Virya = 'ushna' | 'sheeta';

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

/** Generic answer for the 18-question constitutional assessment */
export interface Answer {
  questionId: number;
  choice: string;
}

/** Weather input for the weather mapper engine */
export interface WeatherInput {
  tempCelsius: number;
  humidityPercent: number;
  windSpeedMs: number;
}

/** Minimal food interface for the convergence engine */
export interface FoodForConvergence {
  ayurveda: {
    virya: Virya;
    vataEffect: number;
    pittaEffect: number;
    kaphaEffect: number;
    seasonalFit: Record<Ritu, number>;
  };
  tcm: {
    thermalNature: ThermalNature;
    elementFit: Record<TCMElement, number>;
  };
  naturopathy: {
    evidenceLevel: 'strong' | 'moderate' | 'weak' | 'none';
    metabolicTypeAffinity: Record<MetabolicType, number>;
  };
}

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

/** Dosha profile -- vata, pitta, kapha scores summing to 1.0 */
export interface DoshaProfile {
  vata: number;
  pitta: number;
  kapha: number;
}

/** Classification of the dosha profile */
export interface DoshaClassification {
  type: 'single' | 'dual' | 'tridoshic';
  primary: Dosha;
  secondary: Dosha;
  tertiary: Dosha;
}

/** TCM element scores summing to 1.0 */
export interface ElementScores {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}

/** Seasonal context from the season engine */
export interface SeasonalContext {
  ayurvedaRitu: Ritu;
  tcmPhase: TCMPhase;
  isTransition: boolean;
  transitionProgress: number;
  seasonalIntensity: number;
  adjacentRitu?: Ritu;
}

/** Full constitutional profile from the constitution engine */
export interface ConstitutionalProfile {
  doshaScores: DoshaProfile;
  doshaType: DoshaClassification;
  elementScores: ElementScores | null;
  primaryElement: TCMElement | null;
  secondaryElement: TCMElement | null;
  metabolicType: MetabolicType | null;
  ansDominance: ANSDominance | null;
  completeness: number;
  confidence: number;
  summary: string;
}

/** Organ clock context from the organ-clock engine */
export interface OrganClockContext {
  activeOrgan: string;
  pairedOrgan: string;
  element: TCMElement;
  isDigestiveWindow: boolean;
  isWindDownWindow: boolean;
}

/** Weather context from the weather mapper engine */
export interface WeatherContext {
  thermalNeed: number;
  kaphaAggravation: number;
  vataAggravation: number;
  pittaAggravation: number;
  tcmWindPattern: 'none' | 'wind_cold' | 'wind_heat';
}

/** Single dimension result within convergence */
export interface DimensionResult {
  agrees: boolean;
  detail: string;
}

/** Convergence report across traditions */
export interface ConvergenceReport {
  score: number;
  agreementCount: number;
  interestingDivergence: boolean;
  dimensions: {
    thermal: DimensionResult;
    constitutional: DimensionResult;
    seasonal: DimensionResult;
    evidence: DimensionResult;
  };
}

/** Composite day context combining seasonal, weather, and organ clock */
export interface DayContext {
  seasonal: SeasonalContext;
  weather: WeatherContext;
  organClock: OrganClockContext;
}

// ---------------------------------------------------------------------------
// Debug types (intermediate computation values for troubleshooting)
// ---------------------------------------------------------------------------

export interface SeasonalDebug {
  adjustedDayOfYear: number;
  rawDayOfYear: number;
  hemisphereOffset: number;
  distToNextBoundary: number;
  distFromPrevBoundary: number;
  latitudeDampeningInput: number;
}

export interface ConstitutionalDebug {
  rawVata: number;
  rawPitta: number;
  rawKapha: number;
  totalWeight: number;
  perQuestionDominant: string[];
  consistencyRatio: number;
  classificationPath: 'single' | 'dual' | 'tridoshic';
  elementRawScores: Record<string, number> | null;
}

export interface OrganClockDebug {
  inputHour: number;
  inputTimezone: string;
  matchedEntry: number;
}

export interface WeatherDebug {
  rawThermalNeed: number;
  rawKaphaAggravation: number;
  rawHumidityVata: number;
  rawWindVata: number;
  rawPittaAggravation: number;
  combinedVataAggravation: number;
  windPatternInputs: {
    windSpeed: number;
    temp: number;
  };
}

export interface ConvergenceDebug {
  doshaFitScore: number;
  elementFitScore: number;
  seasonalFitScoreAyurveda: number;
  seasonalFitScoreTCM: number;
  ayurvedaThermal: string;
  tcmThermal: string;
  evidenceLevelRaw: string;
  metabolicAffinityScore: number | null;
}

// ---------------------------------------------------------------------------
// Result wrapper types (public output + debug)
// ---------------------------------------------------------------------------

export interface SeasonalResult {
  context: SeasonalContext;
  debug: SeasonalDebug;
}

export interface ConstitutionalResult {
  profile: ConstitutionalProfile;
  debug: ConstitutionalDebug;
}

export interface OrganClockResult {
  context: OrganClockContext;
  debug: OrganClockDebug;
}

export interface WeatherResult {
  context: WeatherContext;
  debug: WeatherDebug;
}

export interface ConvergenceResult {
  report: ConvergenceReport;
  debug: ConvergenceDebug;
}

// ---------------------------------------------------------------------------
// Zod input schemas
// ---------------------------------------------------------------------------

export const AnswerSchema = z.object({
  questionId: z.number().int().min(1).max(18),
  choice: z.string(),
});

export const WeatherInputSchema = z.object({
  tempCelsius: z.number(),
  humidityPercent: z.number().min(0).max(100),
  windSpeedMs: z.number().min(0),
});

/**
 * Seasonal input schema. Validates latitude (-90 to 90) and date as an
 * ISO date string (the API receives strings; conversion to Temporal.PlainDate
 * happens in the engine caller).
 */
export const SeasonalInputSchema = z.object({
  date: z.string().date(),
  latitude: z.number().min(-90).max(90),
});
