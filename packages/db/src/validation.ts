// Zod validation schemas generated from Drizzle table definitions.
// Uses drizzle-zod for automatic schema derivation with manual refinements
// where the DB schema alone does not capture business rules.
//
// NOTE: drizzle-zod 0.8+ internally uses zod/v4, so refinements must also
// use zod/v4 types. Importing from plain "zod" gives v3 types that are
// structurally incompatible with the refinement overrides.

import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod/v4';
import {
  biomarkerFoodMappings,
  culturalCuisines,
  dataSources,
  evidenceClaims,
  foodCategories,
  foods,
  herbs,
  userProfiles,
} from './schema/index.js';

// ---------- Foods ----------

export const insertFoodSchema = createInsertSchema(foods, {
  seed_source: z.enum(['canonical', 'usda', 'llm_drafted', 'manual']),
  validation_status: z.enum(['pending', 'validated', 'flagged', 'human_reviewed']),
});

export const selectFoodSchema = createSelectSchema(foods);

// ---------- Herbs ----------

export const insertHerbSchema = createInsertSchema(herbs, {
  pregnancy_safety: z.enum(['safe', 'caution', 'contraindicated', 'unknown']).nullable(),
  seed_source: z.enum(['canonical', 'usda', 'llm_drafted', 'manual']),
  validation_status: z.enum(['pending', 'validated', 'flagged', 'human_reviewed']),
});

export const selectHerbSchema = createSelectSchema(herbs);

// ---------- Evidence Claims ----------

export const insertEvidenceClaimSchema = createInsertSchema(evidenceClaims);
export const selectEvidenceClaimSchema = createSelectSchema(evidenceClaims);

// ---------- Data Sources ----------

export const insertDataSourceSchema = createInsertSchema(dataSources, {
  entity_type: z.enum(['food', 'herb']),
});

export const selectDataSourceSchema = createSelectSchema(dataSources);

// ---------- Biomarker Food Mappings ----------

export const insertBiomarkerMappingSchema = createInsertSchema(biomarkerFoodMappings, {
  effect_direction: z.enum(['supportive', 'contraindicated']),
});

export const selectBiomarkerMappingSchema = createSelectSchema(biomarkerFoodMappings);

// ---------- Food Categories ----------

export const insertFoodCategorySchema = createInsertSchema(foodCategories);
export const selectFoodCategorySchema = createSelectSchema(foodCategories);

// ---------- Cultural Cuisines ----------

export const insertCulturalCuisineSchema = createInsertSchema(culturalCuisines, {
  entity_type: z.enum(['food', 'herb']),
});

export const selectCulturalCuisineSchema = createSelectSchema(culturalCuisines);

// ---------- User Profiles ----------

export const insertUserProfileSchema = createInsertSchema(userProfiles);
export const selectUserProfileSchema = createSelectSchema(userProfiles);
