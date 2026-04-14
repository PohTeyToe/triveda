/**
 * Resolve food influences for flagged biomarkers by joining against the
 * `biomarker_food_mappings` table.
 */

import { biomarkerFoodMappings, foods } from '@triveda/db';
import type { DbClient } from '@triveda/db';
import { desc, eq, inArray } from 'drizzle-orm';
import type { NormalizedBiomarker } from './canonical-schema.js';
import type { FoodInfluence, FoodInfluenceMap } from './types.js';

const TOP_SUPPORTIVE = 5;
const TOP_CONTRAINDICATED = 3;

/**
 * Alternate canonical keys used by the live DB seed vs. our canonical
 * registry. Maps registry key -> DB key.
 */
const DB_KEY_ALIASES: Record<string, string> = {
  glucose_fasting: 'glucose',
  vitamin_d_25_oh: 'vitamin_d',
  hs_crp: 'crp',
};

function toDbKey(canonicalKey: string): string {
  return DB_KEY_ALIASES[canonicalKey] ?? canonicalKey;
}

export async function resolveFoodInfluences(
  biomarkers: NormalizedBiomarker[],
  db: DbClient,
): Promise<FoodInfluenceMap> {
  const flagged = biomarkers.filter((b) => b.flag !== 'normal');
  if (flagged.length === 0) return {};

  const dbKeys = Array.from(new Set(flagged.map((b) => toDbKey(b.canonicalKey))));

  const rows = await db
    .select({
      canonical_biomarker_key: biomarkerFoodMappings.canonical_biomarker_key,
      food_id: biomarkerFoodMappings.food_id,
      effect_direction: biomarkerFoodMappings.effect_direction,
      effect_magnitude: biomarkerFoodMappings.effect_magnitude,
      mechanism: biomarkerFoodMappings.mechanism,
      citation: biomarkerFoodMappings.citation,
      food_name: foods.name,
    })
    .from(biomarkerFoodMappings)
    .innerJoin(foods, eq(foods.id, biomarkerFoodMappings.food_id))
    .where(inArray(biomarkerFoodMappings.canonical_biomarker_key, dbKeys))
    .orderBy(desc(biomarkerFoodMappings.effect_magnitude));

  // Bucket rows by DB key -> direction.
  const buckets = new Map<
    string,
    { supportive: FoodInfluence[]; contraindicated: FoodInfluence[] }
  >();
  for (const row of rows) {
    const key = row.canonical_biomarker_key;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { supportive: [], contraindicated: [] };
      buckets.set(key, bucket);
    }
    const entry: FoodInfluence = {
      foodId: row.food_id,
      foodName: row.food_name,
      effectDirection: row.effect_direction as 'supportive' | 'contraindicated',
      effectMagnitude: Number(row.effect_magnitude),
      mechanism: row.mechanism,
      citation: row.citation,
    };
    if (entry.effectDirection === 'supportive') {
      bucket.supportive.push(entry);
    } else if (entry.effectDirection === 'contraindicated') {
      bucket.contraindicated.push(entry);
    }
  }

  const out: FoodInfluenceMap = {};
  for (const bm of flagged) {
    const dbKey = toDbKey(bm.canonicalKey);
    const bucket = buckets.get(dbKey);
    if (!bucket) continue;
    out[bm.canonicalKey] = {
      biomarkerName: bm.displayName,
      supportive: bucket.supportive.slice(0, TOP_SUPPORTIVE),
      contraindicated: bucket.contraindicated.slice(0, TOP_CONTRAINDICATED),
    };
  }

  return out;
}
