import { index, numeric, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core';
import { foods } from './foods.js';

export const biomarkerFoodMappings = pgTable(
  'biomarker_food_mappings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    biomarker_name: text('biomarker_name').notNull(),
    canonical_biomarker_key: text('canonical_biomarker_key').notNull(),
    food_id: uuid('food_id')
      .notNull()
      .references(() => foods.id),
    effect_direction: text('effect_direction').notNull(),
    effect_magnitude: numeric('effect_magnitude', {
      precision: 3,
      scale: 2,
    }).notNull(),
    mechanism: text('mechanism'),
    citation: text('citation').notNull(),
  },
  (table) => [
    unique('biomarker_mappings_unique').on(
      table.canonical_biomarker_key,
      table.food_id,
      table.effect_direction,
    ),
    index('biomarker_mappings_key_idx').on(table.canonical_biomarker_key),
  ],
);
