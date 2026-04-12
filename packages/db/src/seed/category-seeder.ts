// category-seeder.ts -- Populates the food_categories table with a two-level
// taxonomy (top-level categories + optional sub-categories).
//
// This is a pure data seeder -- no LLM calls, no external dependencies.
// Uses onConflictDoUpdate on the unique category name for idempotency.

import { sql } from 'drizzle-orm';
import type { DbClient } from '../client.js';
import { foodCategories } from '../schema/index.js';
import type { NewFoodCategory } from '../types.js';

// -------------------------------------------------------------------------
// Category definitions
// -------------------------------------------------------------------------

export interface CategoryDef {
  category: string;
  icon: string;
  display_order: number;
  description: string;
  parent_category?: string;
}

/** Top-level food categories with Lucide icon names. */
export const TOP_LEVEL_CATEGORIES: CategoryDef[] = [
  {
    category: 'grain',
    icon: 'wheat',
    display_order: 1,
    description: 'Whole grains, cereals, and grain-based staples',
  },
  {
    category: 'legume',
    icon: 'bean',
    display_order: 2,
    description: 'Beans, lentils, and pulses',
  },
  {
    category: 'vegetable',
    icon: 'salad',
    display_order: 3,
    description: 'Fresh vegetables across all sub-types',
  },
  {
    category: 'fruit',
    icon: 'apple',
    display_order: 4,
    description: 'Fresh and dried fruits',
  },
  {
    category: 'dairy',
    icon: 'milk',
    display_order: 5,
    description: 'Milk, yogurt, ghee, and dairy products',
  },
  {
    category: 'spice',
    icon: 'flame',
    display_order: 6,
    description: 'Culinary spices and aromatic seasonings',
  },
  {
    category: 'oil',
    icon: 'droplet',
    display_order: 7,
    description: 'Cooking oils and fats',
  },
  {
    category: 'protein',
    icon: 'beef',
    display_order: 8,
    description: 'Animal proteins including meat, fish, and eggs',
  },
  {
    category: 'nut_seed',
    icon: 'nut',
    display_order: 9,
    description: 'Nuts, seeds, and their butters',
  },
  {
    category: 'beverage',
    icon: 'coffee',
    display_order: 10,
    description: 'Teas, herbal infusions, and health beverages',
  },
];

/** Sub-categories with parent references. Display order continues from 11+. */
export const SUB_CATEGORIES: CategoryDef[] = [
  // Vegetable sub-categories
  {
    category: 'leafy_green',
    icon: 'leaf',
    display_order: 11,
    description: 'Spinach, kale, lettuce, and other leafy greens',
    parent_category: 'vegetable',
  },
  {
    category: 'root',
    icon: 'carrot',
    display_order: 12,
    description: 'Root vegetables like beets, carrots, and sweet potatoes',
    parent_category: 'vegetable',
  },
  {
    category: 'cruciferous',
    icon: 'flower2',
    display_order: 13,
    description: 'Broccoli, cauliflower, cabbage, and Brussels sprouts',
    parent_category: 'vegetable',
  },
  {
    category: 'allium',
    icon: 'circle',
    display_order: 14,
    description: 'Onions, garlic, leeks, and shallots',
    parent_category: 'vegetable',
  },
  {
    category: 'squash',
    icon: 'egg',
    display_order: 15,
    description: 'Squash, pumpkin, zucchini, and gourds',
    parent_category: 'vegetable',
  },

  // Fruit sub-categories
  {
    category: 'tropical',
    icon: 'palmtree',
    display_order: 16,
    description: 'Mango, papaya, pineapple, and tropical fruits',
    parent_category: 'fruit',
  },
  {
    category: 'citrus',
    icon: 'citrus',
    display_order: 17,
    description: 'Oranges, lemons, limes, and grapefruit',
    parent_category: 'fruit',
  },
  {
    category: 'berry',
    icon: 'cherry',
    display_order: 18,
    description: 'Blueberries, strawberries, and other berries',
    parent_category: 'fruit',
  },
  {
    category: 'stone',
    icon: 'circle-dot',
    display_order: 19,
    description: 'Peaches, plums, cherries, and apricots',
    parent_category: 'fruit',
  },
  {
    category: 'melon',
    icon: 'oval',
    display_order: 20,
    description: 'Watermelon, cantaloupe, and honeydew',
    parent_category: 'fruit',
  },

  // Protein sub-categories
  {
    category: 'poultry',
    icon: 'bird',
    display_order: 21,
    description: 'Chicken, turkey, and other poultry',
    parent_category: 'protein',
  },
  {
    category: 'fish',
    icon: 'fish',
    display_order: 22,
    description: 'Fish and seafood',
    parent_category: 'protein',
  },
  {
    category: 'red_meat',
    icon: 'bone',
    display_order: 23,
    description: 'Beef, lamb, and other red meats',
    parent_category: 'protein',
  },
  {
    category: 'egg',
    icon: 'egg',
    display_order: 24,
    description: 'Chicken eggs and other poultry eggs',
    parent_category: 'protein',
  },
];

/** All categories combined (top-level + sub-categories). */
export const ALL_CATEGORIES: CategoryDef[] = [...TOP_LEVEL_CATEGORIES, ...SUB_CATEGORIES];

// -------------------------------------------------------------------------
// Seeder function
// -------------------------------------------------------------------------

/**
 * Seeds the food_categories table with the full taxonomy.
 * Idempotent -- uses upsert on the unique category name.
 *
 * @returns The number of rows upserted.
 */
export async function seedCategories(db: DbClient): Promise<number> {
  const rows: NewFoodCategory[] = ALL_CATEGORIES.map((c) => ({
    category: c.category,
    parent_category: c.parent_category ?? null,
    icon: c.icon,
    display_order: c.display_order,
    description: c.description,
  }));

  await db
    .insert(foodCategories)
    .values(rows)
    .onConflictDoUpdate({
      target: foodCategories.category,
      set: {
        parent_category: sql`excluded.parent_category`,
        icon: sql`excluded.icon`,
        display_order: sql`excluded.display_order`,
        description: sql`excluded.description`,
      },
    });

  return rows.length;
}
