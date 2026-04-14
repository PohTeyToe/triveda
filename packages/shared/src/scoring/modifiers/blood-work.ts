/**
 * Blood-work scoring modifier.
 *
 * Pure function — given a candidate food, the user's biomarker snapshot,
 * and the set of biomarker-to-food mappings, return a multiplicative
 * adjustment in [0.85, 1.20]. Returns 1.0 when no biomarker data is
 * available or no mappings apply to this food.
 */

export interface BiomarkerSnapshot {
  reportId: string;
  biomarkers: Array<{
    canonicalKey: string;
    value: number;
    unit: string;
    flag: 'normal' | 'low' | 'high' | 'critical';
  }>;
  uploadedAt: string;
}

export interface FoodMapping {
  canonicalBiomarkerKey: string;
  foodId: string;
  effectDirection: 'supportive' | 'contraindicated';
  effectMagnitude: number;
}

const BLOOD_WORK_CLAMP = { min: 0.85, max: 1.2 };

/**
 * Live DB keys may differ from our canonical registry keys (e.g.
 * `glucose` vs `glucose_fasting`). This map aliases registry keys to
 * whatever the mapping rows use. The lookup is bidirectional — either
 * side can be on disk.
 */
const KEY_ALIASES: Record<string, string> = {
  glucose_fasting: 'glucose',
  glucose: 'glucose_fasting',
  vitamin_d_25_oh: 'vitamin_d',
  vitamin_d: 'vitamin_d_25_oh',
  hs_crp: 'crp',
  crp: 'hs_crp',
};

function aliasesFor(key: string): string[] {
  const out = new Set<string>();
  out.add(key);
  const alt = KEY_ALIASES[key];
  if (alt) out.add(alt);
  return Array.from(out);
}

export function computeBloodWorkModifier(
  foodId: string,
  biomarkerSnapshot: BiomarkerSnapshot | null,
  foodMappings: FoodMapping[],
): number {
  if (!biomarkerSnapshot) return 1.0;

  // Flagged biomarkers only (any non-normal flag).
  const flaggedKeys = new Set<string>();
  for (const bm of biomarkerSnapshot.biomarkers) {
    if (bm.flag === 'normal') continue;
    for (const a of aliasesFor(bm.canonicalKey)) flaggedKeys.add(a);
  }

  if (flaggedKeys.size === 0) return 1.0;

  const relevant = foodMappings.filter(
    (m) => m.foodId === foodId && flaggedKeys.has(m.canonicalBiomarkerKey),
  );

  if (relevant.length === 0) return 1.0;

  let sum = 0;
  for (const m of relevant) {
    sum += m.effectDirection === 'supportive' ? m.effectMagnitude : -m.effectMagnitude;
  }
  const average = sum / relevant.length;

  return Math.max(BLOOD_WORK_CLAMP.min, Math.min(BLOOD_WORK_CLAMP.max, 1.0 + average));
}

/** Backwards-compat: the scoring engine re-exports this name from split 04. */
export function bloodWorkModifierStub(): number {
  return 1.0;
}
