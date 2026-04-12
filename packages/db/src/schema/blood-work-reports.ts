import { index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const bloodWorkReports = pgTable(
  'blood_work_reports',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull(),
    job_id: uuid('job_id').unique().notNull(),
    vendor: text('vendor'),
    status: text('status').notNull().default('pending'),
    stage: text('stage'),
    file_name: text('file_name').notNull(),
    file_size_bytes: integer('file_size_bytes').notNull(),
    page_count: integer('page_count'),
    extraction_method: text('extraction_method'),
    error_message: text('error_message'),
    food_influences: jsonb('food_influences'),
    uploaded_at: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
    started_at: timestamp('started_at', { withTimezone: true }),
    processed_at: timestamp('processed_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('blood_work_reports_user_id_idx').on(table.user_id),
    index('blood_work_reports_job_id_idx').on(table.job_id),
  ],
);
