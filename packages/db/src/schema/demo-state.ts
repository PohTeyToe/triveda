import { jsonb, pgTable, smallint, timestamp, uuid } from 'drizzle-orm/pg-core';

export const demoState = pgTable('demo_state', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull().unique(),
  current_day: smallint('current_day').notNull().default(1),
  recommendations: jsonb('recommendations').default([]),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
