// Barrel export for seed data, importers, and supplementary seeders.

export { FOOD_SEEDS } from './food-data.js';
export { HERB_SEEDS } from './herb-data.js';
export { importFoods, importHerbs, runAllSeeds } from './importers.js';
export type { ImportResult } from './importers.js';

// Supplementary seeders (run after core foods/herbs are seeded)
export {
  seedCategories,
  ALL_CATEGORIES,
  TOP_LEVEL_CATEGORIES,
  SUB_CATEGORIES,
} from './category-seeder.js';
export type { CategoryDef } from './category-seeder.js';

export {
  seedCuisineAffinities,
  derivePrevalenceTag,
  CUISINE_CODES,
  CANONICAL_FOOD_AFFINITIES,
  CANONICAL_HERB_AFFINITIES,
} from './cuisine-seeder.js';
export type { CuisineCode, CuisineAffinityEntry } from './cuisine-seeder.js';

export {
  seedDataSources,
  DATA_SOURCE_REGISTRY,
  CANONICAL_SOURCE_ASSIGNMENTS,
} from './data-source-seeder.js';
export type { DataSourceDef, EntitySourceAssignment } from './data-source-seeder.js';

export {
  seedBiomarkerMappings,
  CANONICAL_BIOMARKERS as BIOMARKER_DEFS,
  CANONICAL_BIOMARKER_MAPPINGS,
} from './biomarker-seeder.js';
export type { BiomarkerDef, BiomarkerMappingEntry } from './biomarker-seeder.js';

export {
  seedEvidenceClaims,
  EVIDENCE_LEVELS,
  CANONICAL_EVIDENCE_CLAIMS,
} from './evidence-seeder.js';
export type { EvidenceLevel, EvidenceClaimEntry } from './evidence-seeder.js';

// Orchestrator
export { runFullSeed } from './orchestrator.js';
export type { SeedResult, SeedPhaseResult } from './orchestrator.js';
