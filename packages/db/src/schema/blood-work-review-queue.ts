import { boolean, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { bloodWorkBiomarkers } from './blood-work-biomarkers.js';
import { bloodWorkReports } from './blood-work-reports.js';

export const bloodWorkReviewQueue = pgTable(
  'blood_work_review_queue',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    biomarker_id: uuid('biomarker_id')
      .notNull()
      .unique()
      .references(() => bloodWorkBiomarkers.id, { onDelete: 'cascade' }),
    report_id: uuid('report_id')
      .notNull()
      .references(() => bloodWorkReports.id, { onDelete: 'cascade' }),
    reason: text('reason').notNull(),
    resolved: boolean('resolved').notNull().default(false),
    resolved_at: timestamp('resolved_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('blood_work_review_queue_report_id_idx').on(table.report_id)],
);
