import { describe, expect, it } from 'vitest';
import { ALL_FEATURE_IDS, type CreditSource, mergeCredits } from '../credits.js';

describe('ALL_FEATURE_IDS', () => {
  it('contains exactly 22 entries', () => {
    expect(ALL_FEATURE_IDS).toHaveLength(22);
  });

  it('has unique IDs', () => {
    const ids = ALL_FEATURE_IDS.map((f) => f.id);
    expect(new Set(ids).size).toBe(22);
  });

  it('has unique feature numbers 1 through 22', () => {
    const nums = ALL_FEATURE_IDS.map((f) => f.featureNumber).sort((a, b) => a - b);
    expect(nums).toEqual(Array.from({ length: 22 }, (_, i) => i + 1));
  });
});

describe('mergeCredits', () => {
  it('returns empty array for empty input', () => {
    expect(mergeCredits([])).toEqual([]);
  });

  it('returns empty array when given an array of empty arrays', () => {
    expect(mergeCredits([[], []])).toEqual([]);
  });

  it('deduplicates overlapping featureIds and sets active=true', () => {
    const sourceA: CreditSource[] = [
      {
        featureId: 'dosha-analysis',
        featureName: 'Dosha Analysis',
        active: false,
        contribution: undefined,
      },
    ];
    const sourceB: CreditSource[] = [
      {
        featureId: 'dosha-analysis',
        featureName: 'Dosha Analysis',
        active: true,
        contribution: 'Assessed Vata dominance',
      },
    ];

    const merged = mergeCredits([sourceA, sourceB]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.featureId).toBe('dosha-analysis');
    expect(merged[0]?.active).toBe(true);
  });

  it('preserves contribution from first active source', () => {
    const sourceA: CreditSource[] = [
      {
        featureId: 'organ-clock',
        featureName: 'Organ Clock',
        active: true,
        contribution: 'Liver meridian active',
      },
    ];
    const sourceB: CreditSource[] = [
      {
        featureId: 'organ-clock',
        featureName: 'Organ Clock',
        active: true,
        contribution: 'Lung meridian active',
      },
    ];

    const merged = mergeCredits([sourceA, sourceB]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.contribution).toBe('Liver meridian active');
  });

  it('falls back to first non-undefined contribution when no source is active', () => {
    const sourceA: CreditSource[] = [
      {
        featureId: 'face-scan',
        featureName: 'Face Scan',
        active: false,
        contribution: undefined,
      },
    ];
    const sourceB: CreditSource[] = [
      {
        featureId: 'face-scan',
        featureName: 'Face Scan',
        active: false,
        contribution: 'Simulated scan data',
      },
    ];

    const merged = mergeCredits([sourceA, sourceB]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.active).toBe(false);
    expect(merged[0]?.contribution).toBe('Simulated scan data');
  });

  it('sorts output by featureId for deterministic output', () => {
    const sources: CreditSource[][] = [
      [
        {
          featureId: 'weather-adaptation',
          featureName: 'Weather Adaptation',
          active: true,
        },
        {
          featureId: 'dosha-analysis',
          featureName: 'Dosha Analysis',
          active: true,
        },
      ],
    ];

    const merged = mergeCredits(sources);
    expect(merged.map((c) => c.featureId)).toEqual(['dosha-analysis', 'weather-adaptation']);
  });
});
