import { date, index, numeric, pgTable, text, uuid } from 'drizzle-orm/pg-core';

export const dataSources = pgTable(
  'data_sources',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    entity_type: text('entity_type').notNull(),
    entity_id: uuid('entity_id').notNull(),
    source_name: text('source_name').notNull(),
    source_url: text('source_url'),
    source_version: text('source_version'),
    verification_date: date('verification_date').notNull(),
    validator: text('validator').notNull(),
    confidence_score: numeric('confidence_score', {
      precision: 3,
      scale: 2,
    }).notNull(),
    disagreement_notes: text('disagreement_notes'),
    properties_covered: text('properties_covered').array().notNull(),
  },
  (table) => [index('data_sources_entity_idx').on(table.entity_type, table.entity_id)],
);
