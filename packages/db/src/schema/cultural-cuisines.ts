import { index, numeric, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core';

export const culturalCuisines = pgTable(
  'cultural_cuisines',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    cuisine: text('cuisine').notNull(),
    entity_type: text('entity_type').notNull(),
    entity_id: uuid('entity_id').notNull(),
    cultural_affinity: numeric('cultural_affinity', {
      precision: 3,
      scale: 2,
    }).notNull(),
    prevalence_tag: text('prevalence_tag').notNull(),
  },
  (table) => [
    unique('cultural_cuisines_unique').on(table.cuisine, table.entity_type, table.entity_id),
    index('cultural_cuisines_cuisine_idx').on(table.cuisine),
  ],
);
