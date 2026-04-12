import { describe, expect, it } from 'vitest';
import { NEUTRAL_SCORE } from '../../factors/constants.js';
import { elementFitScore } from '../../factors/element.js';
import type { ConstitutionalProfile, FoodTCM, TCMElement } from '../../types.js';

function makeTCM(elementFitOverrides: Partial<Record<TCMElement, number>> = {}): FoodTCM {
  const defaults: Record<TCMElement, number> = {
    wood: 0.0,
    fire: 0.0,
    earth: 0.0,
    metal: 0.0,
    water: 0.0,
  };
  return {
    thermalNature: 'neutral',
    organAffinity: [],
    elementFit: { ...defaults, ...elementFitOverrides },
  };
}

function makeProfile(
  primaryElement: TCMElement | null,
  secondaryElement: TCMElement | null = null,
): ConstitutionalProfile {
  return {
    doshaScores: { vata: 0.33, pitta: 0.33, kapha: 0.33 },
    doshaType: { type: 'tridoshic', primary: 'vata', secondary: 'pitta', tertiary: 'kapha' },
    elementScores: primaryElement
      ? { wood: 0.2, fire: 0.2, earth: 0.2, metal: 0.2, water: 0.2 }
      : null,
    primaryElement,
    secondaryElement,
    metabolicType: null,
    ansDominance: null,
    completeness: primaryElement ? 1.0 : 0.5,
    confidence: 0.8,
    summary: 'test profile',
  };
}

describe('elementFitScore', () => {
  it('primary=wood, secondary=fire, food wood=0.8, fire=0.6 -> 0.74', () => {
    const food = makeTCM({ wood: 0.8, fire: 0.6 });
    const profile = makeProfile('wood', 'fire');
    // 0.8*0.7 + 0.6*0.3 = 0.56 + 0.18 = 0.74
    expect(elementFitScore(food, profile)).toBeCloseTo(0.74, 10);
  });

  it('perfect primary (1.0), zero secondary (0.0) -> 0.7', () => {
    const food = makeTCM({ wood: 1.0, fire: 0.0 });
    const profile = makeProfile('wood', 'fire');
    expect(elementFitScore(food, profile)).toBeCloseTo(0.7, 10);
  });

  it('zero primary, perfect secondary -> 0.3', () => {
    const food = makeTCM({ wood: 0.0, fire: 1.0 });
    const profile = makeProfile('wood', 'fire');
    expect(elementFitScore(food, profile)).toBeCloseTo(0.3, 10);
  });

  it('all zeroes -> 0.0', () => {
    const food = makeTCM({ wood: 0.0, fire: 0.0 });
    const profile = makeProfile('wood', 'fire');
    expect(elementFitScore(food, profile)).toBeCloseTo(0.0, 10);
  });

  it('all ones -> 1.0', () => {
    const food = makeTCM({ wood: 1.0, fire: 1.0, earth: 1.0, metal: 1.0, water: 1.0 });
    const profile = makeProfile('wood', 'fire');
    // 1.0*0.7 + 1.0*0.3 = 1.0
    expect(elementFitScore(food, profile)).toBeCloseTo(1.0, 10);
  });

  it('null primaryElement -> NEUTRAL_SCORE (0.5) fallback', () => {
    const food = makeTCM({ wood: 1.0, fire: 1.0 });
    const profile = makeProfile(null, null);
    expect(elementFitScore(food, profile)).toBe(NEUTRAL_SCORE);
  });

  it('score in [0, 1] for varied inputs', () => {
    const elements: TCMElement[] = ['wood', 'fire', 'earth', 'metal', 'water'];
    const affinities = [0.0, 0.25, 0.5, 0.75, 1.0];

    for (const primary of elements) {
      for (const secondary of elements) {
        if (primary === secondary) continue;
        for (const pAff of affinities) {
          for (const sAff of affinities) {
            const food = makeTCM({ [primary]: pAff, [secondary]: sAff });
            const profile = makeProfile(primary, secondary);
            const score = elementFitScore(food, profile);
            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(1);
          }
        }
      }
    }
  });
});
