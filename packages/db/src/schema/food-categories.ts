import { integer, pgTable, text, uuid } from 'drizzle-orm/pg-core';

export const foodCategories = pgTable('food_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  category: text('category').notNull().unique(),
  parent_category: text('parent_category'),
  icon: text('icon'),
  display_order: integer('display_order').notNull(),
  description: text('description'),
});
