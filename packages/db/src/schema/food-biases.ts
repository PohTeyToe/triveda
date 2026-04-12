/**
 * Food biases table.
 *
 * Stores temporary food scoring biases created by trigger rules.
 * Upsert semantics -- a new trigger of the same type overwrites the previous bias.
 */

import { index, jsonb, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const foodBiases = pgTable(
  'food_biases',
  {
    user_id: uuid('user_id').notNull(),
    bias_type: text('bias_type').notNull(),
    bias_config: jsonb('bias_config').$type<{ tag: string; multiplier: number }>().notNull(),
    expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
    source_trigger: text('source_trigger').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.user_id, table.bias_type] }),
    index('idx_food_biases_user').on(table.user_id),
  ],
);
