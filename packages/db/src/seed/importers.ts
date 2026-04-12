// Seed importers: batch-insert food and herb seed data via Drizzle.
// Uses ON CONFLICT DO UPDATE so seeds can be re-run safely (upsert).

import { sql } from 'drizzle-orm';
import type { DbClient } from '../client.js';
import { foods, herbs } from '../schema/index.js';
import { FOOD_SEEDS } from './food-data.js';
import { HERB_SEEDS } from './herb-data.js';

/** Result returned by each importer. */
export interface ImportResult {
  inserted: number;
  updated: number;
  total: number;
}

// ---------------------------------------------------------------------------
// Internal: chunk an array into batches of a given size.
// Drizzle/postgres.js can handle large inserts, but chunking avoids
// hitting the 65535 parameter limit on very large batches.
// ---------------------------------------------------------------------------
function chunk<T>(arr: readonly T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

// ---------------------------------------------------------------------------
// Food importer
// ---------------------------------------------------------------------------

/**
 * Batch-inserts all food seed data into the `foods` table.
 *
 * Uses ON CONFLICT (name) DO UPDATE to make re-runs safe.
 * All columns except `id` and `created_at` are updated on conflict,
 * so seed corrections propagate on re-run.
 *
 * @param db - A Drizzle client (typically the service client).
 * @param batchSize - Number of rows per INSERT statement. Default 25.
 * @returns Counts of inserted, updated, and total rows processed.
 */
export async function importFoods(db: DbClient, batchSize = 25): Promise<ImportResult> {
  const batches = chunk(FOOD_SEEDS, batchSize);
  let inserted = 0;
  let updated = 0;

  for (const batch of batches) {
    const result = await db
      .insert(foods)
      .values(batch)
      .onConflictDoUpdate({
        target: foods.name,
        set: {
          name_sanskrit: sql`excluded.name_sanskrit`,
          name_chinese: sql`excluded.name_chinese`,
          category: sql`excluded.category`,
          subcategory: sql`excluded.subcategory`,
          description: sql`excluded.description`,
          rasa: sql`excluded.rasa`,
          virya: sql`excluded.virya`,
          vipaka: sql`excluded.vipaka`,
          guna: sql`excluded.guna`,
          vata_effect: sql`excluded.vata_effect`,
          pitta_effect: sql`excluded.pitta_effect`,
          kapha_effect: sql`excluded.kapha_effect`,
          ritu_fit: sql`excluded.ritu_fit`,
          thermal_nature: sql`excluded.thermal_nature`,
          flavor: sql`excluded.flavor`,
          organ_affinity: sql`excluded.organ_affinity`,
          actions: sql`excluded.actions`,
          element_fit: sql`excluded.element_fit`,
          glycemic_index: sql`excluded.glycemic_index`,
          bioactive_compounds: sql`excluded.bioactive_compounds`,
          contraindications: sql`excluded.contraindications`,
          seed_source: sql`excluded.seed_source`,
          validation_status: sql`excluded.validation_status`,
          updated_at: sql`now()`,
        },
      })
      .returning({ id: foods.id, updatedAt: foods.updated_at, createdAt: foods.created_at });

    for (const row of result) {
      // If created_at equals updated_at (within a second), it was a new insert.
      // Otherwise the row existed and was updated.
      const created = row.createdAt?.getTime() ?? 0;
      const updatedTime = row.updatedAt?.getTime() ?? 0;
      if (Math.abs(updatedTime - created) < 1000) {
        inserted++;
      } else {
        updated++;
      }
    }
  }

  return { inserted, updated, total: FOOD_SEEDS.length };
}

// ---------------------------------------------------------------------------
// Herb importer
// ---------------------------------------------------------------------------

/**
 * Batch-inserts all herb seed data into the `herbs` table.
 *
 * Uses ON CONFLICT (name) DO UPDATE to make re-runs safe.
 *
 * @param db - A Drizzle client (typically the service client).
 * @param batchSize - Number of rows per INSERT statement. Default 25.
 * @returns Counts of inserted, updated, and total rows processed.
 */
export async function importHerbs(db: DbClient, batchSize = 25): Promise<ImportResult> {
  const batches = chunk(HERB_SEEDS, batchSize);
  let inserted = 0;
  let updated = 0;

  for (const batch of batches) {
    const result = await db
      .insert(herbs)
      .values(batch)
      .onConflictDoUpdate({
        target: herbs.name,
        set: {
          name_sanskrit: sql`excluded.name_sanskrit`,
          name_chinese: sql`excluded.name_chinese`,
          category: sql`excluded.category`,
          subcategory: sql`excluded.subcategory`,
          description: sql`excluded.description`,
          rasa: sql`excluded.rasa`,
          virya: sql`excluded.virya`,
          vipaka: sql`excluded.vipaka`,
          guna: sql`excluded.guna`,
          vata_effect: sql`excluded.vata_effect`,
          pitta_effect: sql`excluded.pitta_effect`,
          kapha_effect: sql`excluded.kapha_effect`,
          ritu_fit: sql`excluded.ritu_fit`,
          thermal_nature: sql`excluded.thermal_nature`,
          flavor: sql`excluded.flavor`,
          organ_affinity: sql`excluded.organ_affinity`,
          actions: sql`excluded.actions`,
          element_fit: sql`excluded.element_fit`,
          herb_actions: sql`excluded.herb_actions`,
          contraindications: sql`excluded.contraindications`,
          dosage_forms: sql`excluded.dosage_forms`,
          pregnancy_safety: sql`excluded.pregnancy_safety`,
          prabhava: sql`excluded.prabhava`,
          is_culinary: sql`excluded.is_culinary`,
          bioactive_compounds: sql`excluded.bioactive_compounds`,
          seed_source: sql`excluded.seed_source`,
          validation_status: sql`excluded.validation_status`,
          updated_at: sql`now()`,
        },
      })
      .returning({ id: herbs.id, updatedAt: herbs.updated_at, createdAt: herbs.created_at });

    for (const row of result) {
      const created = row.createdAt?.getTime() ?? 0;
      const updatedTime = row.updatedAt?.getTime() ?? 0;
      if (Math.abs(updatedTime - created) < 1000) {
        inserted++;
      } else {
        updated++;
      }
    }
  }

  return { inserted, updated, total: HERB_SEEDS.length };
}

// ---------------------------------------------------------------------------
// Combined seed runner
// ---------------------------------------------------------------------------

/**
 * Runs both food and herb importers. Convenience function for seed scripts.
 *
 * @param db - A Drizzle client (typically the service client).
 * @returns Results for both food and herb imports.
 */
export async function runAllSeeds(
  db: DbClient,
): Promise<{ foods: ImportResult; herbs: ImportResult }> {
  const foodResult = await importFoods(db);
  const herbResult = await importHerbs(db);
  return { foods: foodResult, herbs: herbResult };
}
