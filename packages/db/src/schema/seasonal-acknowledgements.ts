import { pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

export const seasonalTransitionAcknowledgements = pgTable(
  'seasonal_transition_acknowledgements',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull(),
    from_ritu: text('from_ritu').notNull(),
    to_ritu: text('to_ritu').notNull(),
    acknowledged_at: timestamp('acknowledged_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('seasonal_ack_user_transition_idx').on(table.user_id, table.from_ritu, table.to_ritu),
  ],
);
