/**
 * Telemetry table schema.
 *
 * Stores request metadata for observability and debugging.
 * Server-internal only: no user access via RLS.
 */

import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const telemetry = pgTable(
  'telemetry',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    request_id: text('request_id').notNull(),
    user_id: uuid('user_id'),
    method: text('method').notNull(),
    path: text('path').notNull(),
    status_code: integer('status_code').notNull(),
    latency_ms: integer('latency_ms').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_telemetry_request_id').on(table.request_id),
    index('idx_telemetry_user_id_created').on(table.user_id, table.created_at),
  ],
);
