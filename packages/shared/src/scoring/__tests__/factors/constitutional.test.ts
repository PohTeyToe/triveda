import { describe, expect, it } from 'vitest';
import { constitutionalFitScore } from '../../factors/constitutional.js';
import type { DoshaProfile, FoodAyurveda, Ritu } from '../../types.js';

function makeAyurveda(vataEffect: number, pittaEffect: number, kaphaEffect: number): FoodAyurveda {
  const rituFit = {
    shishira: 0.5,
    vasanta: 0.5,
    grishma: 0.5,
    varsha: 0.5,
    sharad: 0.5,
    hemanta: 0.5,
  } as Record<Ritu, number>;
  return { vataEffect, pittaEffect, kaphaEffect, rituFit };
}

describe('constitutionalFitScore', () => {
  it('Vata-dominant + food pacifies vata (vataEffect=-2) -> 0.85', () => {
    const food = makeAyurveda(-2, 0, 0);
    const profile: DoshaProfile = { vata: 0.7, pitta: 0.15, kapha: 0.15 };
    // benefit = (2*0.7) + (0*0.15) + (0*0.15) = 1.4
    // score = (1.4 + 2) / 4 = 0.85
    expect(constitutionalFitScore(food, profile)).toBeCloseTo(0.85, 10);
  });

  it('Vata-dominant + food aggravates vata (vataEffect=+2) -> 0.15', () => {
    const food = makeAyurveda(2, 0, 0);
    const profile: DoshaProfile = { vata: 0.7, pitta: 0.15, kapha: 0.15 };
    // benefit = (-2*0.7) + (0*0.15) + (0*0.15) = -1.4
    // score = (-1.4 + 2) / 4 = 0.15
    expect(constitutionalFitScore(food, profile)).toBeCloseTo(0.15, 10);
  });

  it('Balanced (0.33/0.33/0.33) + all effects 0 -> 0.5', () => {
    const food = makeAyurveda(0, 0, 0);
    const profile: DoshaProfile = { vata: 0.33, pitta: 0.33, kapha: 0.33 };
    expect(constitutionalFitScore(food, profile)).toBeCloseTo(0.5, 10);
  });

  it('Balanced + all effects -2 -> 1.0', () => {
    const food = makeAyurveda(-2, -2, -2);
    // With 0.33 each: benefit = 2*0.33*3 = 1.98, score = (1.98+2)/4 = 0.995
    // With exactly 1/3 each: 2*(1/3)*3 = 2.0, score = (2+2)/4 = 1.0
    const profile: DoshaProfile = { vata: 1 / 3, pitta: 1 / 3, kapha: 1 / 3 };
    expect(constitutionalFitScore(food, profile)).toBeCloseTo(1.0, 10);
  });

  it('Pitta-dominant + food pacifies pitta -> high score', () => {
    const food = makeAyurveda(0, -2, 0);
    const profile: DoshaProfile = { vata: 0.15, pitta: 0.7, kapha: 0.15 };
    // benefit = (0*0.15) + (2*0.7) + (0*0.15) = 1.4
    // score = (1.4 + 2) / 4 = 0.85
    expect(constitutionalFitScore(food, profile)).toBeCloseTo(0.85, 10);
  });

  it('Kapha-dominant + food aggravates kapha -> low score', () => {
    const food = makeAyurveda(0, 0, 2);
    const profile: DoshaProfile = { vata: 0.1, pitta: 0.1, kapha: 0.8 };
    // benefit = 0 + 0 + (-2*0.8) = -1.6
    // score = (-1.6 + 2) / 4 = 0.1
    expect(constitutionalFitScore(food, profile)).toBeCloseTo(0.1, 10);
  });

  it('Dual-dosha (0.45/0.40/0.15) + mixed effects -> hand-computed', () => {
    const food = makeAyurveda(-1, 1, 0);
    const profile: DoshaProfile = { vata: 0.45, pitta: 0.4, kapha: 0.15 };
    // benefit = (1*0.45) + (-1*0.4) + (0*0.15) = 0.45 - 0.4 = 0.05
    // score = (0.05 + 2) / 4 = 0.5125
    expect(constitutionalFitScore(food, profile)).toBeCloseTo(0.5125, 10);
  });

  it('score always in [0, 1] for extreme inputs', () => {
    const profiles: DoshaProfile[] = [
      { vata: 1.0, pitta: 0.0, kapha: 0.0 },
      { vata: 0.0, pitta: 1.0, kapha: 0.0 },
      { vata: 0.0, pitta: 0.0, kapha: 1.0 },
      { vata: 0.5, pitta: 0.3, kapha: 0.2 },
    ];
    const effects = [-2, -1, 0, 1, 2];

    for (const profile of profiles) {
      for (const v of effects) {
        for (const p of effects) {
          for (const k of effects) {
            const score = constitutionalFitScore(makeAyurveda(v, p, k), profile);
            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(1);
          }
        }
      }
    }
  });
});
