// @triveda/shared - Shared types, Zod schemas, engine/LLM interfaces, credits
// This package is imported by both apps/web and apps/api
//
// IMPORTANT: No side effects on import. Env validation is lazy (only runs
// when getWebEnv() or getApiEnv() is explicitly called).

// Credits
export {
  ALL_FEATURE_IDS,
  mergeCredits,
  type FeatureId,
  type FeatureEntry,
  type CreditSource,
} from './credits.js';

// Telemetry
export type { TelemetryLogger } from './telemetry.js';

// Env config -- namespace re-exports to avoid eagerly importing env modules
export * as webEnv from './env/web.js';
export * as apiEnv from './env/api.js';

// Engine types, schemas, and utilities
export type {
  // Enums / unions
  Dosha,
  Ritu,
  TCMPhase,
  TCMElement,
  MetabolicType,
  ANSDominance,
  ThermalNature,
  Virya,
  // Input types
  Answer,
  WeatherInput,
  FoodForConvergence,
  // Output types
  DoshaProfile,
  DoshaClassification,
  ElementScores,
  SeasonalContext,
  ConstitutionalProfile,
  OrganClockContext,
  WeatherContext,
  DimensionResult,
  ConvergenceReport,
  DayContext,
  // Debug types
  SeasonalDebug,
  ConstitutionalDebug,
  OrganClockDebug,
  WeatherDebug,
  ConvergenceDebug,
  // Result wrappers
  SeasonalResult,
  ConstitutionalResult,
  OrganClockResult,
  WeatherResult,
  ConvergenceResult,
  // Legacy interface stubs
  Season,
  SeasonEngine,
  ConstitutionAnswer,
  ConstitutionResult,
  ConstitutionEngine,
  OrganMeridian,
  OrganClock,
  WeatherData,
  AyurvedicQualities,
  WeatherMapper,
  TraditionRecommendation,
  ConvergenceDetector,
} from './engines/index.js';

export {
  AnswerSchema,
  WeatherInputSchema,
  SeasonalInputSchema,
} from './engines/index.js';

export {
  fromDate,
  getDayOfYear,
  isLeapYear,
  clamp,
  normalize,
  mode,
  linearInterpolate,
} from './engines/index.js';

// LLM types and schemas (runtime lives in apps/api/src/llm/)
export type {
  TraditionType,
  AyurvedaInput,
  TCMInput,
  NaturopathyInput,
  SynthesisInput,
  AyurvedaOutput,
  TCMOutput,
  NaturopathyOutput,
  SynthesisOutput,
  DailyFoodInput,
  DailyFoodLLMResult,
  OrchestrationMetadata,
  CallMetadata,
  TraditionCallResult,
  TraditionCallErrorCause,
  CircuitState,
  CircuitBreakerConfig,
  CircuitBreakerState,
  ProviderDegradationEvent,
  CostEstimate,
  TotalCostEstimate,
  SSEEvent,
  SSEEventType,
  ProviderConfig,
  TraditionProviderMap,
} from './llm/index.js';

export { TraditionCallError, DEFAULT_PROVIDER_MAP } from './llm/index.js';

export {
  ayurvedaOutputSchema,
  tcmOutputSchema,
  naturopathyOutputSchema,
  synthesisOutputSchema,
} from './llm/index.js';

// Scoring engine types, constants, and schemas
export type {
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
  FactorName,
  DecayStep,
} from './scoring/index.js';

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
  RituSchema,
  TCMElementSchema,
  ThermalNatureSchema,
  FeedbackResponseSchema,
  FoodAyurvedaSchema,
  FoodTCMSchema,
  FoodForScoringSchema,
  FoodFeedbackSchema,
  ModifierValuesSchema,
} from './scoring/index.js';
