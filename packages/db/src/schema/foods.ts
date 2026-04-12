import { index, jsonb, pgTable, smallint, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { ayurvedaColumns, tcmColumns } from './shared-columns.js';

/** Compound present in a food or herb, with measured amount. */
export type BioactiveCompound = {
  name: string;
  amount_per_100g: number;
  unit: string;
};

export const foods = pgTable(
  'foods',
  {
    // Identity
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

    // Evidence / naturopathy (foods-only)
    glycemic_index: smallint('glycemic_index'),
    bioactive_compounds: jsonb('bioactive_compounds').$type<BioactiveCompound[]>(),
    contraindications: text('contraindications').array(),

    // Metadata
    seed_source: text('seed_source').notNull(),
    validation_status: text('validation_status').notNull().default('pending'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('foods_category_subcategory_idx').on(table.category, table.subcategory),
    index('foods_rasa_gin_idx').using('gin', table.rasa),
    index('foods_flavor_gin_idx').using('gin', table.flavor),
    index('foods_organ_affinity_gin_idx').using('gin', table.organ_affinity),
    index('foods_ritu_fit_gin_idx').using('gin', table.ritu_fit),
    index('foods_element_fit_gin_idx').using('gin', table.element_fit),
  ],
);
