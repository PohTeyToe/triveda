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

// Engine interfaces
export type {
  Season,
  SeasonResult,
  SeasonEngine,
  ConstitutionAnswer,
  DoshaProfile,
  ConstitutionResult,
  ConstitutionEngine,
  OrganMeridian,
  OrganClock,
  WeatherData,
  AyurvedicQualities,
  WeatherMapper,
  TraditionRecommendation,
  ConvergenceResult,
  ConvergenceDetector,
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
