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

// Engine credit sources
export type { EngineCreditSource } from './engine-credits.js';
export {
  SEASONAL_MAPPING_CREDIT,
  ORGAN_CLOCK_TIMING_CREDIT,
  WEATHER_ADJUSTMENT_CREDIT,
  DOSHA_ANALYSIS_CREDIT,
  FIVE_ELEMENT_AFFINITY_CREDIT,
  CONVERGENCE_DETECTION_CREDIT,
  PROGRESSIVE_PROFILE_STATE_CREDIT,
  ENGINE_CREDITS,
} from './engine-credits.js';

// Seasonal engine (split 02)
export { getSeasonalContext, getNextRitu, getPreviousRitu } from './seasonal.js';

// Constitutional engine (split 02)
export {
  scoreConstitution,
  classifyDosha,
  computeConfidence,
  generateSummary,
} from './constitutional.js';

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
// Convergence detector (split 02)
export {
  computeConvergence,
  thermalAgreement,
  constitutionalAgreement,
  seasonalAgreement,
  evidenceAgreement,
} from './convergence.js';
