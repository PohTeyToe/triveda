// Barrel export for all Drizzle table schemas.
// drizzle-kit and migrations reference this file.

export { foods } from './foods.js';
export { herbs } from './herbs.js';
export { evidenceClaims } from './evidence-claims.js';
export { dataSources } from './data-sources.js';
export { biomarkerFoodMappings } from './biomarker-mappings.js';
export { foodCategories } from './food-categories.js';
export { culturalCuisines } from './cultural-cuisines.js';
export { userProfiles } from './user-profiles.js';
export { constitutionalProfiles } from './constitutional-profiles.js';
export { foodFeedback } from './food-feedback.js';
export { dailyCheckIns } from './daily-check-ins.js';
export { faceScanReadings } from './face-scan-readings.js';
export { demoState } from './demo-state.js';
export { seasonalTransitionAcknowledgements } from './seasonal-acknowledgements.js';
export { telemetry } from './telemetry.js';
export { bloodWorkReports } from './blood-work-reports.js';
export { bloodWorkBiomarkers } from './blood-work-biomarkers.js';
export { bloodWorkReviewQueue } from './blood-work-review-queue.js';
export { weeklyHerbs, weeklyHerbFeedback } from './weekly-herbs.js';
export { triggerState, lifestyleTriggerFeedback } from './trigger-state.js';
export { foodBiases } from './food-biases.js';

// Re-export shared column types for downstream consumers
export type { RituFit, ElementFit } from './shared-columns.js';
export type { BioactiveCompound } from './foods.js';
export type { TraditionVisibility } from './user-profiles.js';
