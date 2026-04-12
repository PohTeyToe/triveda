import { boolean, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { BioactiveCompound } from './foods.js';
import { ayurvedaColumns, tcmColumns } from './shared-columns.js';

export const herbs = pgTable(
  'herbs',
  {
    // Identity (same shape as foods)
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull().unique(),
    name_sanskrit: text('name_sanskrit'),
    name_chinese: text('name_chinese'),
    category: text('category').notNull(),
    subcategory: text('subcategory'),
    description: text('description'),

    // Ayurveda properties
    ...ayurvedaColumns,

    // TCM properties
    ...tcmColumns,

    // Herb-specific columns (no glycemic_index)
    herb_actions: text('herb_actions').array().notNull(),
    contraindications: text('contraindications').array(),
    dosage_forms: text('dosage_forms').array(),
    pregnancy_safety: text('pregnancy_safety'),
    prabhava: text('prabhava'),
    is_culinary: boolean('is_culinary').notNull().default(false),
    bioactive_compounds: jsonb('bioactive_compounds').$type<BioactiveCompound[]>(),

    // Metadata
    seed_source: text('seed_source').notNull(),
    validation_status: text('validation_status').notNull().default('pending'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('herbs_category_subcategory_idx').on(table.category, table.subcategory),
    index('herbs_rasa_gin_idx').using('gin', table.rasa),
    index('herbs_flavor_gin_idx').using('gin', table.flavor),
    index('herbs_organ_affinity_gin_idx').using('gin', table.organ_affinity),
    index('herbs_ritu_fit_gin_idx').using('gin', table.ritu_fit),
    index('herbs_element_fit_gin_idx').using('gin', table.element_fit),
  ],
);
