import {
  boolean,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

export const faceScanReadings = pgTable(
  'face_scan_readings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull(),
    vata_delta: numeric('vata_delta', { precision: 4, scale: 3 }).notNull(),
    pitta_delta: numeric('pitta_delta', { precision: 4, scale: 3 }).notNull(),
    kapha_delta: numeric('kapha_delta', { precision: 4, scale: 3 }).notNull(),
    wood_hint: numeric('wood_hint', { precision: 4, scale: 3 }).notNull(),
    fire_hint: numeric('fire_hint', { precision: 4, scale: 3 }).notNull(),
    earth_hint: numeric('earth_hint', { precision: 4, scale: 3 }).notNull(),
    metal_hint: numeric('metal_hint', { precision: 4, scale: 3 }).notNull(),
    water_hint: numeric('water_hint', { precision: 4, scale: 3 }).notNull(),
    stress_level: numeric('stress_level', { precision: 4, scale: 3 }).notNull(),
    skin_tone: text('skin_tone').notNull(),
    confidence: numeric('confidence', { precision: 4, scale: 3 }).notNull(),
    simulated: boolean('simulated').notNull().default(true),
    seed_hour: integer('seed_hour').notNull(),
    generated_at: timestamp('generated_at', { withTimezone: true }).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('face_scan_readings_user_hour_idx').on(table.user_id, table.seed_hour)],
);
