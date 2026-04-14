/**
 * Load the user's latest complete blood work report as a snapshot suitable
 * for the blood-work scoring modifier. Also loads the relevant food
 * mappings once per request so the modifier stays pure.
 */

import { biomarkerFoodMappings, bloodWorkBiomarkers, bloodWorkReports } from '@triveda/db';
import type { DbClient } from '@triveda/db';
import type {
  BiomarkerSnapshot,
  FoodMapping,
} from '@triveda/shared/src/scoring/modifiers/blood-work.js';
import { and, desc, eq, inArray } from 'drizzle-orm';

/**
 * DB keys sometimes differ from our registry keys. Passing every alias
 * into the query keeps the lookup cheap.
 */
const DB_ALIASES: Record<string, string[]> = {
  glucose_fasting: ['glucose', 'glucose_fasting'],
  vitamin_d_25_oh: ['vitamin_d', 'vitamin_d_25_oh'],
  hs_crp: ['crp', 'hs_crp'],
};

function dbKeysFor(canonicalKey: string): string[] {
  return DB_ALIASES[canonicalKey] ?? [canonicalKey];
}

export async function loadBiomarkerSnapshot(
  db: DbClient,
  userId: string,
): Promise<{ snapshot: BiomarkerSnapshot | null; mappings: FoodMapping[] }> {
  const [latest] = await db
    .select({
      id: bloodWorkReports.id,
      uploaded_at: bloodWorkReports.uploaded_at,
    })
    .from(bloodWorkReports)
    .where(and(eq(bloodWorkReports.user_id, userId), eq(bloodWorkReports.status, 'complete')))
    .orderBy(desc(bloodWorkReports.uploaded_at))
    .limit(1);

  if (!latest) return { snapshot: null, mappings: [] };

  const biomarkerRows = await db
    .select({
      canonical_key: bloodWorkBiomarkers.canonical_key,
      value: bloodWorkBiomarkers.value,
      unit: bloodWorkBiomarkers.unit,
      flag: bloodWorkBiomarkers.flag,
    })
    .from(bloodWorkBiomarkers)
    .where(eq(bloodWorkBiomarkers.report_id, latest.id));

  const snapshot: BiomarkerSnapshot = {
    reportId: latest.id,
    biomarkers: biomarkerRows.map((row) => ({
      canonicalKey: row.canonical_key,
      value: Number(row.value),
      unit: row.unit,
      flag: row.flag as BiomarkerSnapshot['biomarkers'][number]['flag'],
    })),
    uploadedAt: latest.uploaded_at.toISOString(),
  };

  // Collect the DB keys for each biomarker so the mapping join is narrow.
  const allKeys = new Set<string>();
  for (const bm of snapshot.biomarkers) {
    for (const k of dbKeysFor(bm.canonicalKey)) allKeys.add(k);
  }

  if (allKeys.size === 0) return { snapshot, mappings: [] };

  const mappingRows = await db
    .select({
      canonical_biomarker_key: biomarkerFoodMappings.canonical_biomarker_key,
      food_id: biomarkerFoodMappings.food_id,
      effect_direction: biomarkerFoodMappings.effect_direction,
      effect_magnitude: biomarkerFoodMappings.effect_magnitude,
    })
    .from(biomarkerFoodMappings)
    .where(inArray(biomarkerFoodMappings.canonical_biomarker_key, Array.from(allKeys)));

  const mappings: FoodMapping[] = mappingRows.map((row) => ({
    canonicalBiomarkerKey: row.canonical_biomarker_key,
    foodId: row.food_id,
    effectDirection: row.effect_direction as 'supportive' | 'contraindicated',
    effectMagnitude: Number(row.effect_magnitude),
  }));

  return { snapshot, mappings };
}
