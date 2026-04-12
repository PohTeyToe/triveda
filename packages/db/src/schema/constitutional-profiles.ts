import { jsonb, pgTable, smallint, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const constitutionalProfiles = pgTable('constitutional_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull().unique(),
  dosha_ratios: jsonb('dosha_ratios')
    .$type<{ vata: number; pitta: number; kapha: number }>()
    .notNull(),
  element_type: text('element_type'),
  plain_language_summary: text('plain_language_summary').notNull(),
  tradition_sections: jsonb('tradition_sections')
    .$type<{ ayurveda: string; tcm: string; naturopathy: string }>()
    .notNull(),
  answers: jsonb('answers')
    .$type<Array<{ questionId: number; choice: string }>>()
    .notNull()
    .default([]),
  answer_count: smallint('answer_count').notNull().default(0),
  completeness: smallint('completeness').notNull().default(0),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
