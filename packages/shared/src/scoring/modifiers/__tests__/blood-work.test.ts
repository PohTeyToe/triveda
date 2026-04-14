import { describe, expect, it } from 'vitest';
import {
  type BiomarkerSnapshot,
  type FoodMapping,
  computeBloodWorkModifier,
} from '../blood-work.js';

const SNAPSHOT: BiomarkerSnapshot = {
  reportId: 'report-1',
  biomarkers: [
    { canonicalKey: 'vitamin_d_25_oh', value: 42, unit: 'nmol/L', flag: 'low' },
    { canonicalKey: 'ferritin', value: 18, unit: 'ug/L', flag: 'low' },
    { canonicalKey: 'glucose_fasting', value: 5.2, unit: 'mmol/L', flag: 'normal' },
  ],
  uploadedAt: '2026-04-12T00:00:00Z',
};

const MAPPINGS: FoodMapping[] = [
  // salmon supports vitamin_d
  {
    canonicalBiomarkerKey: 'vitamin_d_25_oh',
    foodId: 'salmon-id',
    effectDirection: 'supportive',
    effectMagnitude: 0.15,
  },
  // spinach supports ferritin
  {
    canonicalBiomarkerKey: 'ferritin',
    foodId: 'spinach-id',
    effectDirection: 'supportive',
    effectMagnitude: 0.12,
  },
  // white bread contraindicated for glucose (should NOT apply since glucose is normal)
  {
    canonicalBiomarkerKey: 'glucose',
    foodId: 'white-bread-id',
    effectDirection: 'contraindicated',
    effectMagnitude: 0.3,
  },
  // ice cream contraindicated for ferritin
  {
    canonicalBiomarkerKey: 'ferritin',
    foodId: 'ice-cream-id',
    effectDirection: 'contraindicated',
    effectMagnitude: 0.2,
  },
];

describe('computeBloodWorkModifier', () => {
  it('returns 1.0 when no snapshot exists', () => {
    expect(computeBloodWorkModifier('salmon-id', null, MAPPINGS)).toBe(1.0);
  });

  it('returns 1.0 when food has no matching mappings', () => {
    expect(computeBloodWorkModifier('unrelated-food', SNAPSHOT, MAPPINGS)).toBe(1.0);
  });

  it('returns > 1.0 for a food with supportive mapping for a flagged biomarker', () => {
    expect(computeBloodWorkModifier('salmon-id', SNAPSHOT, MAPPINGS)).toBeGreaterThan(1.0);
  });

  it('returns < 1.0 for a food with contraindicated mapping', () => {
    expect(computeBloodWorkModifier('ice-cream-id', SNAPSHOT, MAPPINGS)).toBeLessThan(1.0);
  });

  it('ignores mappings for normal-flagged biomarkers', () => {
    // glucose is normal so white-bread mapping should not apply
    expect(computeBloodWorkModifier('white-bread-id', SNAPSHOT, MAPPINGS)).toBe(1.0);
  });

  it('clamps within [0.85, 1.20]', () => {
    const extreme: FoodMapping[] = [
      {
        canonicalBiomarkerKey: 'ferritin',
        foodId: 'monster',
        effectDirection: 'contraindicated',
        effectMagnitude: 10.0,
      },
    ];
    expect(computeBloodWorkModifier('monster', SNAPSHOT, extreme)).toBe(0.85);

    const boost: FoodMapping[] = [
      {
        canonicalBiomarkerKey: 'ferritin',
        foodId: 'super',
        effectDirection: 'supportive',
        effectMagnitude: 10.0,
      },
    ];
    expect(computeBloodWorkModifier('super', SNAPSHOT, boost)).toBe(1.2);
  });

  it('handles DB key aliases (glucose vs glucose_fasting)', () => {
    // Snapshot uses canonical key, mapping uses DB key
    const snap: BiomarkerSnapshot = {
      ...SNAPSHOT,
      biomarkers: [{ canonicalKey: 'glucose_fasting', value: 6.8, unit: 'mmol/L', flag: 'high' }],
    };
    const mappings: FoodMapping[] = [
      {
        canonicalBiomarkerKey: 'glucose', // DB uses 'glucose'
        foodId: 'cinnamon-id',
        effectDirection: 'supportive',
        effectMagnitude: 0.2,
      },
    ];
    expect(computeBloodWorkModifier('cinnamon-id', snap, mappings)).toBeGreaterThan(1.0);
  });

  it('averages effect magnitudes across multiple mappings', () => {
    const mappings: FoodMapping[] = [
      {
        canonicalBiomarkerKey: 'ferritin',
        foodId: 'multi',
        effectDirection: 'supportive',
        effectMagnitude: 0.1,
      },
      {
        canonicalBiomarkerKey: 'vitamin_d_25_oh',
        foodId: 'multi',
        effectDirection: 'supportive',
        effectMagnitude: 0.3,
      },
    ];
    // average = 0.2, so modifier = 1.2 (clamped)
    const result = computeBloodWorkModifier('multi', SNAPSHOT, mappings);
    expect(result).toBeCloseTo(1.2, 2);
  });
});
