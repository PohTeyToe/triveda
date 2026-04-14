import { describe, expect, it } from 'bun:test';
import type { NormalizedBiomarker } from '../../src/workers/blood-work/canonical-schema.js';
import {
  CONFIDENCE_THRESHOLD,
  computeConfidence,
  shouldRouteToReview,
} from '../../src/workers/blood-work/confidence.js';

function biomarker(overrides: Partial<NormalizedBiomarker> = {}): NormalizedBiomarker {
  return {
    canonicalKey: 'ferritin',
    displayName: 'Ferritin',
    value: 50,
    unit: 'ug/L',
    originalUnit: null,
    referenceRangeLow: 20,
    referenceRangeHigh: 200,
    flag: 'normal',
    loincCode: '2276-4',
    confidence: 0.95,
    ...overrides,
  };
}

describe('computeConfidence', () => {
  it('produces base 0.95 for text extraction', () => {
    expect(computeConfidence(biomarker(), 'text')).toBeCloseTo(0.95, 2);
  });

  it('produces base 0.85 for vision + PDF', () => {
    expect(computeConfidence(biomarker(), 'vision', 'application/pdf')).toBeCloseTo(0.85, 2);
  });

  it('produces base 0.80 for vision + image', () => {
    expect(computeConfidence(biomarker(), 'vision', 'image/jpeg')).toBeCloseTo(0.8, 2);
  });

  it('deducts 0.10 for unknown unit', () => {
    expect(computeConfidence(biomarker(), 'text', undefined, { unknownUnit: true })).toBeCloseTo(
      0.85,
      2,
    );
  });

  it('deducts 0.15 for ambiguous match', () => {
    expect(computeConfidence(biomarker(), 'text', undefined, { ambiguous: true })).toBeCloseTo(
      0.8,
      2,
    );
  });

  it('deducts 0.05 for missing reference range', () => {
    expect(
      computeConfidence(biomarker({ referenceRangeLow: null, referenceRangeHigh: null }), 'text'),
    ).toBeCloseTo(0.9, 2);
  });

  it('clamps to [0, 1]', () => {
    // Force a heavily penalized case
    const b = biomarker({ referenceRangeLow: null, referenceRangeHigh: null });
    const score = computeConfidence(b, 'vision', 'image/jpeg', {
      ambiguous: true,
      unknownUnit: true,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('is stable across repeated calls', () => {
    const b = biomarker();
    const a = computeConfidence(b, 'text');
    const c = computeConfidence(b, 'text');
    expect(a).toBe(c);
  });
});

describe('shouldRouteToReview', () => {
  it('does NOT route when confidence >= threshold and no other flags', () => {
    expect(shouldRouteToReview(biomarker(), 0.95)).toBeNull();
  });

  it('routes as low_confidence when below threshold', () => {
    expect(shouldRouteToReview(biomarker(), 0.5)).toBe('low_confidence');
  });

  it('routes as ambiguous_value when flagged ambiguous', () => {
    expect(shouldRouteToReview(biomarker(), 0.9, { ambiguous: true })).toBe('ambiguous_value');
  });

  it('routes as unknown_unit when flagged', () => {
    expect(shouldRouteToReview(biomarker(), 0.9, { unknownUnit: true })).toBe('unknown_unit');
  });

  it('routes as missing_reference_range when both bounds null', () => {
    expect(
      shouldRouteToReview(biomarker({ referenceRangeLow: null, referenceRangeHigh: null }), 0.9),
    ).toBe('missing_reference_range');
  });

  it('prioritizes low_confidence over other reasons', () => {
    expect(
      shouldRouteToReview(biomarker(), 0.4, {
        ambiguous: true,
        unknownUnit: true,
      }),
    ).toBe('low_confidence');
  });
});

describe('CONFIDENCE_THRESHOLD', () => {
  it('is exposed as 0.80', () => {
    expect(CONFIDENCE_THRESHOLD).toBe(0.8);
  });
});
