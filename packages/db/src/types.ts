// Inferred TypeScript types from Drizzle schemas.
// All types use snake_case field names matching Postgres columns.
// Downstream consumers (scoring engine) that need camelCase must map
// at their own boundary -- see split 06's toFoodForScoring() mapper.

import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import type {
  biomarkerFoodMappings,
  constitutionalProfiles,
  culturalCuisines,
  dailyCheckIns,
  dataSources,
  demoState,
  evidenceClaims,
  faceScanReadings,
  foodCategories,
  foodFeedback,
  foods,
  herbs,
  seasonalTransitionAcknowledgements,
  userProfiles,
} from './schema/index.js';

// ---------- Select types (reading from DB) ----------

export type Food = InferSelectModel<typeof foods>;
export type Herb = InferSelectModel<typeof herbs>;
export type EvidenceClaim = InferSelectModel<typeof evidenceClaims>;
export type DataSource = InferSelectModel<typeof dataSources>;
export type BiomarkerFoodMapping = InferSelectModel<typeof biomarkerFoodMappings>;
export type FoodCategory = InferSelectModel<typeof foodCategories>;
export type CulturalCuisine = InferSelectModel<typeof culturalCuisines>;
export type UserProfile = InferSelectModel<typeof userProfiles>;
export type ConstitutionalProfileRow = InferSelectModel<typeof constitutionalProfiles>;
export type FoodFeedbackRow = InferSelectModel<typeof foodFeedback>;
export type DailyCheckInRow = InferSelectModel<typeof dailyCheckIns>;
export type FaceScanReadingRow = InferSelectModel<typeof faceScanReadings>;
export type DemoStateRow = InferSelectModel<typeof demoState>;
export type SeasonalAcknowledgementRow = InferSelectModel<
  typeof seasonalTransitionAcknowledgements
>;

// ---------- Insert types (writing to DB) ----------

export type NewFood = InferInsertModel<typeof foods>;
export type NewHerb = InferInsertModel<typeof herbs>;
export type NewEvidenceClaim = InferInsertModel<typeof evidenceClaims>;
export type NewDataSource = InferInsertModel<typeof dataSources>;
export type NewBiomarkerFoodMapping = InferInsertModel<typeof biomarkerFoodMappings>;
export type NewFoodCategory = InferInsertModel<typeof foodCategories>;
export type NewCulturalCuisine = InferInsertModel<typeof culturalCuisines>;
export type NewUserProfile = InferInsertModel<typeof userProfiles>;
export type NewConstitutionalProfile = InferInsertModel<typeof constitutionalProfiles>;
export type NewFoodFeedback = InferInsertModel<typeof foodFeedback>;
export type NewDailyCheckIn = InferInsertModel<typeof dailyCheckIns>;
export type NewFaceScanReading = InferInsertModel<typeof faceScanReadings>;
export type NewDemoState = InferInsertModel<typeof demoState>;
export type NewSeasonalAcknowledgement = InferInsertModel<
  typeof seasonalTransitionAcknowledgements
>;

// ---------- Property group picks ----------

/** Ayurveda columns only -- used by scoring engine after camelCase mapping. */
export type FoodAyurveda = Pick<
  Food,
  | 'rasa'
  | 'virya'
  | 'vipaka'
  | 'guna'
  | 'vata_effect'
  | 'pitta_effect'
  | 'kapha_effect'
  | 'ritu_fit'
>;

/** TCM columns only -- used by scoring engine after camelCase mapping. */
export type FoodTCM = Pick<
  Food,
  'thermal_nature' | 'flavor' | 'organ_affinity' | 'actions' | 'element_fit'
>;

/** Naturopathy/evidence columns (foods only, herbs lack glycemic_index). */
export type FoodEvidence = Pick<
  Food,
  'glycemic_index' | 'bioactive_compounds' | 'contraindications'
>;
