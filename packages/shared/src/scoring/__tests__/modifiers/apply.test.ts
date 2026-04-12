import { describe, expect, it } from 'vitest';
import { applyModifiers } from '../../modifiers/index.js';
import type { ModifierValues } from '../../types.js';

describe('applyModifiers', () => {
  it('undefined blood work -> excluded from composition, marked latent', () => {
    const values: ModifierValues = {
      bloodWork: undefined,
      culturalMatch: 1.05,
      dailyCheckIn: 1.0,
    };
    const { composite, results } = applyModifiers(values);

    const bw = results.find((r) => r.name === 'bloodWork');
    expect(bw).toBeDefined();
    expect(bw?.applied).toBe(false);
    expect(bw?.value).toBe(1.0);
    expect(bw?.rationale).toBe('Blood work data not available');

    // Composite should only include culturalMatch and dailyCheckIn
    expect(composite).toBeCloseTo(1.05 * 1.0, 10);
  });

  it('all modifiers provided -> all included, all marked active', () => {
    const values: ModifierValues = {
      bloodWork: 1.1,
      culturalMatch: 1.05,
      dailyCheckIn: 0.95,
    };
    const { composite, results } = applyModifiers(values);

    for (const r of results) {
      expect(r.applied).toBe(true);
    }

    // Product: 1.1 * 1.05 * 0.95 = 1.09725
    expect(composite).toBeCloseTo(1.1 * 1.05 * 0.95, 10);
  });

  it('no modifiers (all undefined) -> composite 1.0, all marked latent', () => {
    const values: ModifierValues = {
      bloodWork: undefined,
      culturalMatch: undefined,
      dailyCheckIn: undefined,
    };
    const { composite, results } = applyModifiers(values);

    expect(composite).toBe(1.0);
    for (const r of results) {
      expect(r.applied).toBe(false);
      expect(r.value).toBe(1.0);
    }
  });

  it('returns ModifierResult[] with correct name, value, applied, rationale', () => {
    const values: ModifierValues = {
      bloodWork: 1.15,
      culturalMatch: undefined,
      dailyCheckIn: 0.95,
    };
    const { results } = applyModifiers(values);

    expect(results).toHaveLength(3);

    const bw = results.find((r) => r.name === 'bloodWork');
    expect(bw).toBeDefined();
    expect(bw?.value).toBe(1.15);
    expect(bw?.applied).toBe(true);
    expect(bw?.rationale).toContain('1.15x');

    const cm = results.find((r) => r.name === 'culturalMatch');
    expect(cm).toBeDefined();
    expect(cm?.value).toBe(1.0);
    expect(cm?.applied).toBe(false);
    expect(cm?.rationale).toBe('Cultural match data not available');

    const dc = results.find((r) => r.name === 'dailyCheckIn');
    expect(dc).toBeDefined();
    expect(dc?.value).toBe(0.95);
    expect(dc?.applied).toBe(true);
    expect(dc?.rationale).toContain('0.95x');
  });
});
