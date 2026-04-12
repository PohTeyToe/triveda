/**
 * Weekly herb recommendation tables.
 *
 * weekly_herbs: One row per user per ISO week, stores the selected herb
 * and LLM-generated tradition notes.
 *
 * weekly_herb_feedback: User feedback on weekly herb recommendations.
 */

import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

export const weeklyHerbs = pgTable(
  'weekly_herbs',
  {
    user_id: uuid('user_id').notNull(),
    iso_year: integer('iso_year').notNull(),
    iso_week: integer('iso_week').notNull(),
    herb_id: text('herb_id').notNull(),
    tradition_notes: jsonb('tradition_notes').$type<{
      ayurveda: string;
      tcm: string;
      naturopathy: string;
    } | null>(),
    credits: jsonb('credits').notNull(),
    generated_at: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.user_id, table.iso_year, table.iso_week] }),
    index('idx_weekly_herbs_user_week').on(table.user_id, table.iso_year, table.iso_week),
    check('iso_week_range', sql`${table.iso_week} >= 1 AND ${table.iso_week} <= 53`),
  ],
);

export const weeklyHerbFeedback = pgTable(
  'weekly_herb_feedback',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull(),
    herb_id: text('herb_id').notNull(),
    iso_year: integer('iso_year').notNull(),
    iso_week: integer('iso_week').notNull(),
    feedback_type: text('feedback_type').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('weekly_herb_feedback_user_week_type').on(
      table.user_id,
      table.iso_year,
      table.iso_week,
      table.feedback_type,
    ),
    index('idx_weekly_herb_feedback_user_recent').on(table.user_id, table.iso_year, table.iso_week),
    check(
      'feedback_type_check',
      sql`${table.feedback_type} IN ('tried', 'helpful', 'not_for_me', 'remind_next_week')`,
    ),
  ],
);
