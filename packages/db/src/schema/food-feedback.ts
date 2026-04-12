import { pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

export const foodFeedback = pgTable(
  'food_feedback',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull(),
    suggestion_id: uuid('suggestion_id').notNull(),
    response: text('response').notNull(), // 'tried' or 'rejected'
    symptom_tag: text('symptom_tag'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('food_feedback_user_suggestion_idx').on(table.user_id, table.suggestion_id)],
);
