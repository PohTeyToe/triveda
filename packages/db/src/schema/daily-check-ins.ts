import { pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

export const dailyCheckIns = pgTable(
  'daily_check_ins',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull(),
    date: text('date').notNull(), // YYYY-MM-DD
    mood: text('mood').notNull(), // great, good, okay, poor, bad
    energy: text('energy').notNull(), // high, medium, low
    digestion: text('digestion').notNull(), // great, good, okay, poor, bad
    sleep_quality: text('sleep_quality'), // rested, groggy (nullable)
    symptoms: text('symptoms').array(),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('daily_check_ins_user_date_idx').on(table.user_id, table.date)],
);
