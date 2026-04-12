// Engine types, Zod schemas, and result wrappers
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
} from './types.js';

export {
  AnswerSchema,
  WeatherInputSchema,
  SeasonalInputSchema,
} from './types.js';

// Utility functions
export {
  fromDate,
  getDayOfYear,
  isLeapYear,
  clamp,
  normalize,
  mode,
  linearInterpolate,
} from './utils/index.js';

// Legacy interface stubs (from split 01 -- retained for compatibility)
export type { Season, SeasonEngine } from './season.js';
export type {
  ConstitutionAnswer,
  ConstitutionResult,
  ConstitutionEngine,
} from './constitution.js';
export type { OrganMeridian, OrganClock } from './organ-clock.js';
export type {
  WeatherData,
  AyurvedicQualities,
  WeatherMapper,
} from './weather.js';
export type {
  TraditionRecommendation,
  ConvergenceDetector,
} from './convergence.js';
// Note: ConvergenceResult from convergence.js conflicts with types.ts.
// The new ConvergenceResult from types.ts is the canonical version.
// Import the legacy one directly from './convergence.js' if needed.
