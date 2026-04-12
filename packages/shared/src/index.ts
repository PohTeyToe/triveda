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

// LLM interfaces (types/schemas only -- runtime lives in apps/api)
export type {
  LLMOptions,
  LLMUsage,
  LLMResponse,
  LLMProvider,
  TraditionType,
  AnalysisInput,
  TraditionAnalysisResult,
  TraditionAnalysis,
  TraditionOrchestrator,
} from './llm/index.js';
