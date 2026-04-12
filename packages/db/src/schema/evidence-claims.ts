import { index, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { foods } from './foods.js';

export const evidenceClaims = pgTable(
  'evidence_claims',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    food_id: uuid('food_id')
      .notNull()
      .references(() => foods.id),
    claim: text('claim').notNull(),
    evidence_level: text('evidence_level').notNull(),
    source_citation: text('source_citation').notNull(),
    pubmed_id: text('pubmed_id'),
  },
  (table) => [index('evidence_claims_food_id_idx').on(table.food_id)],
);
