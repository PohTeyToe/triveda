import { describe, expect, it } from 'vitest';
import { GENERATING_CYCLE } from '../../factors/constants.js';
import { isGeneratingElement, organClockScore } from '../../factors/organ-clock.js';
import type { FoodTCM, OrganClockContext, TCMElement } from '../../types.js';

function makeTCM(
  organAffinity: string[] = [],
  elementFitOverrides: Partial<Record<TCMElement, number>> = {},
): FoodTCM {
  const defaults: Record<TCMElement, number> = {
    wood: 0.0,
    fire: 0.0,
    earth: 0.0,
    metal: 0.0,
    water: 0.0,
  };
  return {
    thermalNature: 'neutral',
    organAffinity,
    elementFit: { ...defaults, ...elementFitOverrides },
  };
}

function makeOrganClock(overrides: Partial<OrganClockContext> = {}): OrganClockContext {
  return {
    activeOrgan: 'stomach',
    pairedOrgan: 'spleen',
    element: 'earth',
    isDigestiveWindow: true,
    isWindDownWindow: false,
    ...overrides,
  };
}

describe('organClockScore', () => {
  it('food with stomach in organAffinity, activeOrgan=stomach -> 1.0', () => {
    const food = makeTCM(['stomach']);
    expect(organClockScore(food, makeOrganClock())).toBe(1.0);
  });

  it('food with spleen in organAffinity, activeOrgan=stomach (paired) -> 0.7', () => {
    const food = makeTCM(['spleen']);
    expect(organClockScore(food, makeOrganClock())).toBe(0.7);
  });

  it('food with high fire elementFit, activeOrgan=stomach (earth), mother=fire -> 0.5', () => {
    // earth's mother in generating cycle is fire
    const food = makeTCM([], { fire: 0.8 });
    expect(organClockScore(food, makeOrganClock())).toBe(0.5);
  });

  it('food with no relevant affinity -> 0.3', () => {
    const food = makeTCM(['liver'], { wood: 0.1 });
    expect(organClockScore(food, makeOrganClock())).toBe(0.3);
  });

  it('elementFit at exactly 0.6 for mother -> false (threshold is >0.6)', () => {
    const food = makeTCM([], { fire: 0.6 });
    expect(isGeneratingElement(food, makeOrganClock())).toBe(false);
  });

  it('elementFit at 0.61 for mother -> true', () => {
    const food = makeTCM([], { fire: 0.61 });
    expect(isGeneratingElement(food, makeOrganClock())).toBe(true);
  });

  it('GENERATING_CYCLE correctness', () => {
    expect(GENERATING_CYCLE.wood).toBe('water');
    expect(GENERATING_CYCLE.fire).toBe('wood');
    expect(GENERATING_CYCLE.earth).toBe('fire');
    expect(GENERATING_CYCLE.metal).toBe('earth');
    expect(GENERATING_CYCLE.water).toBe('metal');
  });

  it('score is always one of {0.3, 0.5, 0.7, 1.0}', () => {
    const validScores = new Set([0.3, 0.5, 0.7, 1.0]);
    const organs = ['stomach', 'spleen', 'liver', 'lung', 'kidney', 'heart'];
    const elements: TCMElement[] = ['wood', 'fire', 'earth', 'metal', 'water'];

    for (const activeOrgan of organs) {
      for (const pairedOrgan of organs) {
        for (const element of elements) {
          for (const affOrgan of [[], ['stomach'], ['liver']]) {
            for (const affVal of [0.0, 0.5, 0.7, 1.0]) {
              const motherEl = GENERATING_CYCLE[element];
              const food = makeTCM(affOrgan, { [motherEl]: affVal });
              const ctx = makeOrganClock({ activeOrgan, pairedOrgan, element });
              const score = organClockScore(food, ctx);
              expect(validScores.has(score)).toBe(true);
            }
          }
        }
      }
    }
  });
});
