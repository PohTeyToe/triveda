import { describe, expect, it } from 'vitest';
import { computeCulturalBonus } from '../scoring-integration.js';

describe('computeCulturalBonus', () => {
  it('returns 0 when user has no cuisines', () => {
    const result = computeCulturalBonus([], [{ cuisine_code: 'jamaican', relationship: 'native' }]);
    expect(result.bonus).toBe(0);
    expect(result.matchedCuisines).toEqual([]);
  });

  it('returns 0 when food has no cultural entries', () => {
    const result = computeCulturalBonus(['jamaican'], []);
    expect(result.bonus).toBe(0);
    expect(result.matchedCuisines).toEqual([]);
  });

  it('single native match returns 0.08', () => {
    const result = computeCulturalBonus(
      ['jamaican'],
      [{ cuisine_code: 'jamaican', relationship: 'native' }],
    );
    expect(result.bonus).toBeCloseTo(0.08);
    expect(result.matchedCuisines).toEqual(['jamaican']);
  });

  it('single fusion match returns 0.04', () => {
    const result = computeCulturalBonus(
      ['jamaican'],
      [{ cuisine_code: 'jamaican', relationship: 'fusion' }],
    );
    expect(result.bonus).toBeCloseTo(0.04);
  });

  it('two native matches caps at 0.10', () => {
    const result = computeCulturalBonus(
      ['jamaican', 'indian-north'],
      [
        { cuisine_code: 'jamaican', relationship: 'native' },
        { cuisine_code: 'indian-north', relationship: 'native' },
      ],
    );
    // 0.08 + 0.08 = 0.16, capped to 0.10
    expect(result.bonus).toBeCloseTo(0.1);
  });

  it('user cuisine with no matching food entry gets 0', () => {
    const result = computeCulturalBonus(
      ['jamaican'],
      [{ cuisine_code: 'italian-southern', relationship: 'native' }],
    );
    expect(result.bonus).toBe(0);
    expect(result.matchedCuisines).toEqual([]);
  });

  it('matchedCuisines only includes codes that actually matched', () => {
    const result = computeCulturalBonus(
      ['jamaican', 'korean'],
      [{ cuisine_code: 'jamaican', relationship: 'native' }],
    );
    expect(result.matchedCuisines).toEqual(['jamaican']);
  });
});
