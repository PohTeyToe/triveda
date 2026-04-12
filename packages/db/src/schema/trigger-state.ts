/**
 * Trigger state tables.
 *
 * trigger_state: Tracks dismissal/suppression state per trigger type per user.
 * Upsert semantics -- each dismissal overwrites the previous state.
 *
 * lifestyle_trigger_feedback: User feedback on triggered lifestyle recommendations.
 */

import { sql } from 'drizzle-orm';
import { check, index, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const triggerState = pgTable(
  'trigger_state',
  {
    user_id: uuid('user_id').notNull(),
    trigger_type: text('trigger_type').notNull(),
    dismissal_type: text('dismissal_type').notNull(),
    dismissed_at: timestamp('dismissed_at', { withTimezone: true }).notNull().defaultNow(),
    suppressed_until: timestamp('suppressed_until', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.user_id, table.trigger_type] }),
    index('idx_trigger_state_user').on(table.user_id),
    check(
      'dismissal_type_check',
      sql`${table.dismissal_type} IN ('got_it', 'remind_me', 'not_interested')`,
    ),
  ],
);

export const lifestyleTriggerFeedback = pgTable(
  'lifestyle_trigger_feedback',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull(),
    trigger_type: text('trigger_type').notNull(),
    trigger_instance_id: text('trigger_instance_id').notNull(),
    feedback_type: text('feedback_type').notNull(),
    feedback_detail: text('feedback_detail'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_trigger_feedback_user_type').on(table.user_id, table.trigger_type),
    check(
      'trigger_feedback_type_check',
      sql`${table.feedback_type} IN ('helped', 'tried', 'dismissed')`,
    ),
  ],
);
