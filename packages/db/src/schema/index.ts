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

// Re-export shared column types for downstream consumers
export type { RituFit, ElementFit } from './shared-columns.js';
export type { BioactiveCompound } from './foods.js';
export type { TraditionVisibility } from './user-profiles.js';
