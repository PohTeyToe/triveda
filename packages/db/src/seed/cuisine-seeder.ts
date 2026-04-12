// cuisine-seeder.ts -- Populates the cultural_cuisines table with affinity
// scores mapping foods and culinary herbs to world cuisines.
//
// Each food/herb gets a cultural_affinity score (0.00-1.00) for each cuisine,
// plus a derived prevalence_tag ('staple', 'common', 'occasional', 'rare').
//
// Uses onConflictDoUpdate on (cuisine, entity_type, entity_id) for idempotency.

import { sql } from 'drizzle-orm';
import type { DbClient } from '../client.js';
import { culturalCuisines } from '../schema/index.js';
import type { NewCulturalCuisine } from '../types.js';

// -------------------------------------------------------------------------
// Cuisine codes
// -------------------------------------------------------------------------

export const CUISINE_CODES = [
  'indian',
  'chinese',
  'mediterranean',
  'japanese',
  'mexican',
  'caribbean',
  'middle_eastern',
  'west_african',
  'thai',
  'korean',
  'ethiopian',
  'french',
  'italian',
  'indonesian',
  'vietnamese',
  'turkish',
  'peruvian',
  'moroccan',
  'brazilian',
  'greek',
] as const;

export type CuisineCode = (typeof CUISINE_CODES)[number];

// -------------------------------------------------------------------------
// Affinity data types
// -------------------------------------------------------------------------

export interface CuisineAffinityEntry {
  food_name: string;
  entity_type: 'food' | 'herb';
  affinities: Partial<Record<CuisineCode, number>>;
}

// -------------------------------------------------------------------------
// Prevalence tag derivation
// -------------------------------------------------------------------------

/**
 * Derives a prevalence tag from an affinity score.
 *
 * - >= 0.8: 'staple'
 * - >= 0.5: 'common'
 * - >= 0.2: 'occasional'
 * - <  0.2: 'rare'
 */
export function derivePrevalenceTag(affinity: number): string {
  if (affinity >= 0.8) return 'staple';
  if (affinity >= 0.5) return 'common';
  if (affinity >= 0.2) return 'occasional';
  return 'rare';
}

// -------------------------------------------------------------------------
// Seed data -- curated affinity scores for canonical foods
// -------------------------------------------------------------------------

/**
 * Curated cuisine affinities for the 50 canonical foods.
 * Only non-zero affinities are listed (sparse representation).
 * Foods not listed here get no cuisine rows until LLM expansion.
 */
export const CANONICAL_FOOD_AFFINITIES: CuisineAffinityEntry[] = [
  {
    food_name: 'basmati rice',
    entity_type: 'food',
    affinities: {
      indian: 0.95,
      middle_eastern: 0.7,
      thai: 0.5,
      caribbean: 0.3,
      chinese: 0.2,
    },
  },
  {
    food_name: 'oats',
    entity_type: 'food',
    affinities: {
      mediterranean: 0.4,
      french: 0.3,
      italian: 0.2,
    },
  },
  {
    food_name: 'quinoa',
    entity_type: 'food',
    affinities: {
      peruvian: 0.9,
      mediterranean: 0.4,
      mexican: 0.3,
    },
  },
  {
    food_name: 'mung bean',
    entity_type: 'food',
    affinities: {
      indian: 0.9,
      chinese: 0.7,
      thai: 0.5,
      korean: 0.5,
      vietnamese: 0.4,
    },
  },
  {
    food_name: 'red lentil',
    entity_type: 'food',
    affinities: {
      indian: 0.95,
      turkish: 0.8,
      middle_eastern: 0.7,
      ethiopian: 0.6,
      moroccan: 0.4,
    },
  },
  {
    food_name: 'chickpea',
    entity_type: 'food',
    affinities: {
      indian: 0.9,
      middle_eastern: 0.95,
      mediterranean: 0.8,
      turkish: 0.8,
      moroccan: 0.7,
      ethiopian: 0.5,
      greek: 0.6,
    },
  },
  {
    food_name: 'spinach',
    entity_type: 'food',
    affinities: {
      indian: 0.8,
      mediterranean: 0.7,
      italian: 0.6,
      greek: 0.7,
      middle_eastern: 0.5,
      french: 0.5,
      japanese: 0.4,
    },
  },
  {
    food_name: 'sweet potato',
    entity_type: 'food',
    affinities: {
      caribbean: 0.8,
      west_african: 0.85,
      japanese: 0.6,
      korean: 0.5,
      brazilian: 0.5,
      peruvian: 0.4,
    },
  },
  {
    food_name: 'bitter gourd',
    entity_type: 'food',
    affinities: {
      indian: 0.8,
      chinese: 0.7,
      thai: 0.5,
      vietnamese: 0.5,
      indonesian: 0.4,
      caribbean: 0.3,
    },
  },
  {
    food_name: 'ghee',
    entity_type: 'food',
    affinities: {
      indian: 0.95,
      middle_eastern: 0.6,
      ethiopian: 0.7,
    },
  },
  {
    food_name: 'coconut oil',
    entity_type: 'food',
    affinities: {
      indian: 0.7,
      thai: 0.8,
      indonesian: 0.85,
      caribbean: 0.7,
      brazilian: 0.4,
      vietnamese: 0.4,
    },
  },
  {
    food_name: 'olive oil',
    entity_type: 'food',
    affinities: {
      mediterranean: 0.95,
      italian: 0.95,
      greek: 0.95,
      french: 0.8,
      turkish: 0.8,
      moroccan: 0.7,
      middle_eastern: 0.7,
    },
  },
  {
    food_name: 'yogurt',
    entity_type: 'food',
    affinities: {
      indian: 0.9,
      turkish: 0.9,
      greek: 0.9,
      middle_eastern: 0.85,
      mediterranean: 0.7,
      ethiopian: 0.4,
    },
  },
  {
    food_name: 'mango',
    entity_type: 'food',
    affinities: {
      indian: 0.9,
      thai: 0.8,
      caribbean: 0.7,
      mexican: 0.6,
      indonesian: 0.5,
      brazilian: 0.5,
      vietnamese: 0.4,
    },
  },
  {
    food_name: 'pomegranate',
    entity_type: 'food',
    affinities: {
      middle_eastern: 0.85,
      indian: 0.7,
      turkish: 0.7,
      moroccan: 0.5,
      greek: 0.5,
      mediterranean: 0.4,
    },
  },
  {
    food_name: 'dates',
    entity_type: 'food',
    affinities: {
      middle_eastern: 0.95,
      moroccan: 0.8,
      indian: 0.5,
      ethiopian: 0.4,
    },
  },
  {
    food_name: 'almond',
    entity_type: 'food',
    affinities: {
      indian: 0.7,
      middle_eastern: 0.8,
      mediterranean: 0.7,
      moroccan: 0.6,
      french: 0.5,
      italian: 0.4,
    },
  },
  {
    food_name: 'salmon',
    entity_type: 'food',
    affinities: {
      japanese: 0.9,
      korean: 0.6,
      french: 0.5,
      mediterranean: 0.4,
    },
  },
  {
    food_name: 'egg',
    entity_type: 'food',
    affinities: {
      chinese: 0.8,
      japanese: 0.7,
      korean: 0.7,
      french: 0.8,
      thai: 0.6,
      mexican: 0.7,
      indian: 0.5,
      mediterranean: 0.5,
      italian: 0.5,
    },
  },
  {
    food_name: 'tofu',
    entity_type: 'food',
    affinities: {
      chinese: 0.9,
      japanese: 0.9,
      korean: 0.85,
      thai: 0.7,
      vietnamese: 0.7,
      indonesian: 0.6,
    },
  },
  {
    food_name: 'honey',
    entity_type: 'food',
    affinities: {
      indian: 0.7,
      middle_eastern: 0.7,
      greek: 0.8,
      moroccan: 0.6,
      ethiopian: 0.5,
      turkish: 0.5,
    },
  },
  {
    food_name: 'green tea',
    entity_type: 'food',
    affinities: {
      japanese: 0.95,
      chinese: 0.9,
      korean: 0.7,
      moroccan: 0.6,
    },
  },
  {
    food_name: 'lemon',
    entity_type: 'food',
    affinities: {
      mediterranean: 0.8,
      indian: 0.7,
      middle_eastern: 0.7,
      greek: 0.8,
      italian: 0.7,
      moroccan: 0.7,
      turkish: 0.6,
      mexican: 0.5,
      thai: 0.4,
    },
  },
  {
    food_name: 'avocado',
    entity_type: 'food',
    affinities: {
      mexican: 0.95,
      peruvian: 0.6,
      brazilian: 0.5,
      caribbean: 0.4,
      japanese: 0.3,
    },
  },
  {
    food_name: 'broccoli',
    entity_type: 'food',
    affinities: {
      chinese: 0.6,
      italian: 0.5,
      japanese: 0.4,
      thai: 0.3,
    },
  },
  {
    food_name: 'garlic',
    entity_type: 'food',
    affinities: {
      italian: 0.95,
      mediterranean: 0.9,
      chinese: 0.85,
      korean: 0.9,
      indian: 0.8,
      thai: 0.7,
      middle_eastern: 0.8,
      mexican: 0.7,
      french: 0.8,
      turkish: 0.8,
      greek: 0.85,
      moroccan: 0.7,
      ethiopian: 0.5,
      brazilian: 0.6,
    },
  },
  {
    food_name: 'ginger',
    entity_type: 'food',
    affinities: {
      indian: 0.9,
      chinese: 0.85,
      japanese: 0.8,
      thai: 0.8,
      korean: 0.6,
      caribbean: 0.5,
      indonesian: 0.7,
      vietnamese: 0.5,
      ethiopian: 0.3,
    },
  },
  {
    food_name: 'beetroot',
    entity_type: 'food',
    affinities: {
      mediterranean: 0.5,
      indian: 0.4,
      moroccan: 0.3,
      greek: 0.4,
    },
  },
  // Spices (in foods table, not herbs)
  {
    food_name: 'turmeric',
    entity_type: 'food',
    affinities: {
      indian: 0.95,
      thai: 0.5,
      indonesian: 0.6,
      middle_eastern: 0.4,
      moroccan: 0.3,
    },
  },
  {
    food_name: 'cumin',
    entity_type: 'food',
    affinities: {
      indian: 0.95,
      middle_eastern: 0.85,
      mexican: 0.7,
      moroccan: 0.8,
      turkish: 0.7,
      ethiopian: 0.6,
    },
  },
  {
    food_name: 'cinnamon',
    entity_type: 'food',
    affinities: {
      indian: 0.8,
      middle_eastern: 0.8,
      moroccan: 0.7,
      mexican: 0.5,
      ethiopian: 0.5,
      french: 0.4,
    },
  },
  {
    food_name: 'black pepper',
    entity_type: 'food',
    affinities: {
      indian: 0.9,
      french: 0.8,
      italian: 0.7,
      chinese: 0.6,
      thai: 0.6,
      vietnamese: 0.6,
      mediterranean: 0.7,
    },
  },
  {
    food_name: 'coriander',
    entity_type: 'food',
    affinities: {
      indian: 0.9,
      thai: 0.8,
      mexican: 0.7,
      middle_eastern: 0.7,
      vietnamese: 0.7,
      moroccan: 0.6,
      chinese: 0.4,
    },
  },
  {
    food_name: 'fenugreek',
    entity_type: 'food',
    affinities: {
      indian: 0.9,
      ethiopian: 0.7,
      middle_eastern: 0.5,
      moroccan: 0.3,
    },
  },
  {
    food_name: 'cardamom',
    entity_type: 'food',
    affinities: {
      indian: 0.9,
      middle_eastern: 0.85,
      ethiopian: 0.6,
      turkish: 0.5,
      moroccan: 0.4,
    },
  },
  {
    food_name: 'chicken',
    entity_type: 'food',
    affinities: {
      indian: 0.9,
      chinese: 0.85,
      thai: 0.8,
      mexican: 0.8,
      korean: 0.7,
      japanese: 0.6,
      caribbean: 0.7,
      middle_eastern: 0.7,
      french: 0.7,
      italian: 0.6,
      west_african: 0.7,
      ethiopian: 0.6,
    },
  },
  {
    food_name: 'miso',
    entity_type: 'food',
    affinities: {
      japanese: 0.95,
      korean: 0.4,
      chinese: 0.3,
    },
  },
  {
    food_name: 'sesame seed',
    entity_type: 'food',
    affinities: {
      chinese: 0.8,
      korean: 0.85,
      japanese: 0.75,
      middle_eastern: 0.8,
      indian: 0.6,
      turkish: 0.5,
    },
  },
  {
    food_name: 'bok choy',
    entity_type: 'food',
    affinities: {
      chinese: 0.9,
      korean: 0.5,
      thai: 0.4,
      vietnamese: 0.4,
      japanese: 0.3,
    },
  },
  {
    food_name: 'shiitake mushroom',
    entity_type: 'food',
    affinities: {
      japanese: 0.9,
      chinese: 0.85,
      korean: 0.7,
      thai: 0.3,
    },
  },
  {
    food_name: 'tomato',
    entity_type: 'food',
    affinities: {
      italian: 0.95,
      mexican: 0.9,
      mediterranean: 0.85,
      indian: 0.7,
      greek: 0.8,
      turkish: 0.7,
      middle_eastern: 0.6,
      thai: 0.4,
    },
  },
];

/**
 * Curated cuisine affinities for culinary herbs (is_culinary = true in herbs table).
 * Note: common spices like turmeric, ginger, cumin, cinnamon, black pepper, etc.
 * are in the foods table, not the herbs table. Their affinities are in
 * CANONICAL_FOOD_AFFINITIES above.
 */
export const CANONICAL_HERB_AFFINITIES: CuisineAffinityEntry[] = [
  {
    food_name: 'tulsi',
    entity_type: 'herb',
    affinities: {
      indian: 0.9,
      thai: 0.5,
      indonesian: 0.3,
    },
  },
  {
    food_name: 'peppermint',
    entity_type: 'herb',
    affinities: {
      middle_eastern: 0.85,
      moroccan: 0.8,
      indian: 0.5,
      turkish: 0.6,
      greek: 0.5,
      vietnamese: 0.4,
    },
  },
  {
    food_name: 'moringa',
    entity_type: 'herb',
    affinities: {
      indian: 0.7,
      west_african: 0.8,
      ethiopian: 0.4,
      thai: 0.3,
      indonesian: 0.3,
    },
  },
  {
    food_name: 'licorice',
    entity_type: 'herb',
    affinities: {
      chinese: 0.8,
      indian: 0.5,
      middle_eastern: 0.5,
      japanese: 0.4,
    },
  },
  {
    food_name: 'amalaki',
    entity_type: 'herb',
    affinities: {
      indian: 0.8,
    },
  },
  {
    food_name: 'ginseng',
    entity_type: 'herb',
    affinities: {
      chinese: 0.8,
      korean: 0.9,
      japanese: 0.4,
    },
  },
  {
    food_name: 'dang gui',
    entity_type: 'herb',
    affinities: {
      chinese: 0.85,
      korean: 0.5,
      japanese: 0.4,
    },
  },
  {
    food_name: 'astragalus',
    entity_type: 'herb',
    affinities: {
      chinese: 0.85,
      korean: 0.4,
    },
  },
];

// -------------------------------------------------------------------------
// Batch insert helper
// -------------------------------------------------------------------------

/**
 * Converts CuisineAffinityEntry records into NewCulturalCuisine rows
 * and inserts them with upsert semantics.
 */
async function batchInsertAffinities(
  db: DbClient,
  entries: CuisineAffinityEntry[],
  entityIdLookup: Map<string, string>,
): Promise<number> {
  const rows: NewCulturalCuisine[] = [];

  for (const entry of entries) {
    const entityId = entityIdLookup.get(entry.food_name.toLowerCase());
    if (!entityId) continue;

    for (const [cuisine, score] of Object.entries(entry.affinities)) {
      if (score === undefined) continue;
      rows.push({
        cuisine,
        entity_type: entry.entity_type,
        entity_id: entityId,
        cultural_affinity: score.toFixed(2),
        prevalence_tag: derivePrevalenceTag(score),
      });
    }
  }

  if (rows.length === 0) return 0;

  // Insert in chunks of 500 to avoid parameter limits
  const CHUNK_SIZE = 500;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    await db
      .insert(culturalCuisines)
      .values(chunk)
      .onConflictDoUpdate({
        target: [
          culturalCuisines.cuisine,
          culturalCuisines.entity_type,
          culturalCuisines.entity_id,
        ],
        set: {
          cultural_affinity: sql`excluded.cultural_affinity`,
          prevalence_tag: sql`excluded.prevalence_tag`,
        },
      });
  }

  return rows.length;
}

// -------------------------------------------------------------------------
// Main seeder
// -------------------------------------------------------------------------

/**
 * Seeds cuisine affinity data for foods and culinary herbs.
 *
 * Requires food and herb IDs to already exist in the database.
 * Accepts lookup maps from lowercase name to UUID.
 *
 * @param db - Database client (service role).
 * @param foodIdLookup - Map of lowercase food name to food UUID.
 * @param herbIdLookup - Map of lowercase herb name to herb UUID.
 * @returns Total number of cuisine affinity rows upserted.
 */
export async function seedCuisineAffinities(
  db: DbClient,
  foodIdLookup: Map<string, string>,
  herbIdLookup: Map<string, string>,
): Promise<number> {
  const foodCount = await batchInsertAffinities(db, CANONICAL_FOOD_AFFINITIES, foodIdLookup);
  const herbCount = await batchInsertAffinities(db, CANONICAL_HERB_AFFINITIES, herbIdLookup);
  return foodCount + herbCount;
}
