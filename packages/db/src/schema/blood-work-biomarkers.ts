import { boolean, index, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { bloodWorkReports } from './blood-work-reports.js';

export const bloodWorkBiomarkers = pgTable(
  'blood_work_biomarkers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    report_id: uuid('report_id')
      .notNull()
      .references(() => bloodWorkReports.id, { onDelete: 'cascade' }),
    canonical_key: text('canonical_key').notNull(),
    display_name: text('display_name').notNull(),
    value: numeric('value').notNull(),
    unit: text('unit').notNull(),
    original_unit: text('original_unit'),
    reference_range_low: numeric('reference_range_low'),
    reference_range_high: numeric('reference_range_high'),
    flag: text('flag').notNull(),
    confidence: numeric('confidence', { precision: 3, scale: 2 }).notNull(),
    loinc_code: text('loinc_code'),
    extraction_notes: text('extraction_notes'),
    manually_corrected: boolean('manually_corrected').notNull().default(false),
    corrected_at: timestamp('corrected_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('blood_work_biomarkers_report_id_idx').on(table.report_id),
    index('blood_work_biomarkers_canonical_key_idx').on(table.canonical_key),
  ],
);
