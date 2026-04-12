import { describe, expect, it } from 'vitest';
import { CUISINES } from '../../cuisines/index.js';
import { CULTURAL_BONUS_WEIGHTS, getCulturalBonus } from '../index.js';

describe('getCulturalBonus', () => {
  it('returns 0.08 for native relationship', () => {
    expect(getCulturalBonus('jamaican', 'native')).toBeCloseTo(0.08);
  });

  it('returns 0.08 for common relationship', () => {
    expect(getCulturalBonus('jamaican', 'common')).toBeCloseTo(0.08);
  });

  it('returns 0.04 for fusion relationship', () => {
    expect(getCulturalBonus('jamaican', 'fusion')).toBeCloseTo(0.04);
  });

  it('returns 0 for none relationship', () => {
    expect(getCulturalBonus('jamaican', 'none')).toBe(0);
  });

  it('returns 0 for unknown cuisine code', () => {
    expect(getCulturalBonus('martian', 'native')).toBe(0);
  });

  it('default weight is 0.08 for all known cuisines', () => {
    for (const cuisine of CUISINES) {
      expect(CULTURAL_BONUS_WEIGHTS[cuisine.code]).toBe(0.08);
    }
  });
});
