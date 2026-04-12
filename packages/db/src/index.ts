// @triveda/db - Drizzle schemas, types, and validation for the Triveda database.

// Database client factory
export {
  createServiceClient,
  createAnonClient,
  createAuthenticatedClient,
  getDb,
  closeAll,
} from './client.js';

export type { DbClient, DbSchema } from './client.js';

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
  constitutionalProfiles,
  foodFeedback,
  dailyCheckIns,
  faceScanReadings,
  demoState,
  seasonalTransitionAcknowledgements,
  telemetry,
  bloodWorkReports,
  bloodWorkBiomarkers,
  bloodWorkReviewQueue,
  weeklyHerbs,
  weeklyHerbFeedback,
  triggerState,
  lifestyleTriggerFeedback,
  foodBiases,
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
  ConstitutionalProfileRow,
  FoodFeedbackRow,
  DailyCheckInRow,
  FaceScanReadingRow,
  DemoStateRow,
  SeasonalAcknowledgementRow,
  NewFood,
  NewHerb,
  NewEvidenceClaim,
  NewDataSource,
  NewBiomarkerFoodMapping,
  NewFoodCategory,
  NewCulturalCuisine,
  NewUserProfile,
  NewConstitutionalProfile,
  NewFoodFeedback,
  NewDailyCheckIn,
  NewFaceScanReading,
  NewDemoState,
  NewSeasonalAcknowledgement,
  BloodWorkReportRow,
  BloodWorkBiomarkerRow,
  BloodWorkReviewQueueRow,
  NewBloodWorkReport,
  NewBloodWorkBiomarker,
  NewBloodWorkReviewQueue,
  WeeklyHerbRow,
  WeeklyHerbFeedbackRow,
  TriggerStateRow,
  LifestyleTriggerFeedbackRow,
  FoodBiasRow,
  NewWeeklyHerb,
  NewWeeklyHerbFeedback,
  NewTriggerState,
  NewLifestyleTriggerFeedback,
  NewFoodBias,
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
