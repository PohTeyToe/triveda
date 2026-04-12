// @triveda/db - Drizzle schemas, types, and validation for the Triveda database.

// Table schemas
export {
  foods,
  herbs,
  evidenceClaims,
  dataSources,
  biomarkerFoodMappings,
  foodCategories,
  culturalCuisines,
  userProfiles,
} from './schema/index.js';

// Shared column types
export type {
  RituFit,
  ElementFit,
  BioactiveCompound,
  TraditionVisibility,
} from './schema/index.js';

// Inferred TypeScript types
export type {
  Food,
  Herb,
  EvidenceClaim,
  DataSource,
  BiomarkerFoodMapping,
  FoodCategory,
  CulturalCuisine,
  UserProfile,
  NewFood,
  NewHerb,
  NewEvidenceClaim,
  NewDataSource,
  NewBiomarkerFoodMapping,
  NewFoodCategory,
  NewCulturalCuisine,
  NewUserProfile,
  FoodAyurveda,
  FoodTCM,
  FoodEvidence,
} from './types.js';

// Zod validation schemas
export {
  insertFoodSchema,
  selectFoodSchema,
  insertHerbSchema,
  selectHerbSchema,
  insertEvidenceClaimSchema,
  selectEvidenceClaimSchema,
  insertDataSourceSchema,
  selectDataSourceSchema,
  insertBiomarkerMappingSchema,
  selectBiomarkerMappingSchema,
  insertFoodCategorySchema,
  selectFoodCategorySchema,
  insertCulturalCuisineSchema,
  selectCulturalCuisineSchema,
  insertUserProfileSchema,
  selectUserProfileSchema,
} from './validation.js';
