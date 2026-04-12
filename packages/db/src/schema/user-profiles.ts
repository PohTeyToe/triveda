import { jsonb, numeric, pgTable, smallint, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/** Per-tradition UI visibility toggles. */
export type TraditionVisibility = {
  ayurveda: boolean;
  tcm: boolean;
  naturopathy: boolean;
};

export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull().unique(),
  dietary_restrictions: text('dietary_restrictions').array().default([]),
  tradition_visibility: jsonb('tradition_visibility')
    .$type<TraditionVisibility>()
    .default({ ayurveda: true, tcm: true, naturopathy: true }),
  cultural_cuisine_preferences: text('cultural_cuisine_preferences').array().default([]),
  lat: numeric('lat', { precision: 9, scale: 6 }),
  lon: numeric('lon', { precision: 9, scale: 6 }),
  city: text('city'),
  weekly_herb_day: smallint('weekly_herb_day').default(0),
  timezone: text('timezone').default('UTC'),
  profile_completeness: smallint('profile_completeness').notNull().default(0),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
