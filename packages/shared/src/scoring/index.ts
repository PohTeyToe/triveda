// Scoring engine barrel export

// Types
export type {
  Dosha,
  ThermalNature,
  Contribution,
  FoodAyurveda,
  FoodTCM,
  FoodForScoring,
  FoodFeedback,
  ModifierValues,
  ScoringContext,
  FactorDetail,
  FactorBreakdown,
  ModifierResult,
  ScoredFood,
  ScoreBreakdown,
  ScoringTelemetry,
} from './types.js';

// Re-exported types from engines/credits (available via scoring barrel)
export type {
  ConstitutionalProfile,
  DoshaProfile,
  Ritu,
  TCMElement,
  SeasonalContext,
  WeatherContext,
  OrganClockContext,
  CreditSource,
} from './types.js';

// Constants
export {
  FACTOR_WEIGHTS,
  THERMAL_VALUES,
  DECAY_STEPS,
  HARD_REJECT_DAYS,
  GENERATING_CYCLE,
  GENERATING_ELEMENT_THRESHOLD,
  PRIMARY_ELEMENT_WEIGHT,
  SECONDARY_ELEMENT_WEIGHT,
  NEUTRAL_SCORE,
  MODIFIER_CLAMP,
  SCORE_CLAMP,
} from './factors/constants.js';

export type { FactorName, DecayStep } from './factors/constants.js';

// Zod schemas
export {
  RituSchema,
  TCMElementSchema,
  ThermalNatureSchema,
  FeedbackResponseSchema,
  FoodAyurvedaSchema,
  FoodTCMSchema,
  FoodForScoringSchema,
  FoodFeedbackSchema,
  ModifierValuesSchema,
} from './schemas.js';
