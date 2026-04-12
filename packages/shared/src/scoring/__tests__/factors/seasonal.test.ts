import { describe, expect, it } from 'vitest';
import { seasonalScore } from '../../factors/seasonal.js';
import type { FoodAyurveda, Ritu, SeasonalContext } from '../../types.js';

function makeAyurveda(rituFitOverrides: Partial<Record<Ritu, number>> = {}): FoodAyurveda {
  const defaults: Record<Ritu, number> = {
    shishira: 0.5,
    vasanta: 0.5,
    grishma: 0.5,
    varsha: 0.5,
    sharad: 0.5,
    hemanta: 0.5,
  };
  return {
    vataEffect: 0,
    pittaEffect: 0,
    kaphaEffect: 0,
    rituFit: { ...defaults, ...rituFitOverrides },
  };
}

function makeSeasonal(overrides: Partial<SeasonalContext> = {}): SeasonalContext {
  return {
    ayurvedaRitu: 'hemanta',
    tcmPhase: 'water',
    isTransition: false,
    transitionProgress: 0,
    seasonalIntensity: 1.0,
    ...overrides,
  };
}

describe('seasonalScore', () => {
  it('rituFit[hemanta]=0.9, non-transition, intensity=1.0 -> 0.9', () => {
    const food = makeAyurveda({ hemanta: 0.9 });
    const ctx = makeSeasonal({ seasonalIntensity: 1.0 });
    expect(seasonalScore(food, ctx)).toBeCloseTo(0.9, 10);
  });

  it('rituFit[hemanta]=0.9, non-transition, intensity=0.3 -> 0.27', () => {
    const food = makeAyurveda({ hemanta: 0.9 });
    const ctx = makeSeasonal({ seasonalIntensity: 0.3 });
    expect(seasonalScore(food, ctx)).toBeCloseTo(0.27, 10);
  });

  it('transition, progress=0.5, current=0.8, adjacent=0.4 -> blended * intensity', () => {
    const food = makeAyurveda({ hemanta: 0.8, shishira: 0.4 });
    const ctx = makeSeasonal({
      isTransition: true,
      transitionProgress: 0.5,
      adjacentRitu: 'shishira',
      seasonalIntensity: 1.0,
    });
    // blended = 0.5 * 0.8 + 0.5 * 0.4 = 0.6
    expect(seasonalScore(food, ctx)).toBeCloseTo(0.6, 10);
  });

  it('transition, progress=0.0 -> equals pure current ritu score', () => {
    const food = makeAyurveda({ hemanta: 0.8, shishira: 0.4 });
    const ctx = makeSeasonal({
      isTransition: true,
      transitionProgress: 0.0,
      adjacentRitu: 'shishira',
      seasonalIntensity: 1.0,
    });
    // blended = 1.0 * 0.8 + 0.0 * 0.4 = 0.8
    expect(seasonalScore(food, ctx)).toBeCloseTo(0.8, 10);
  });

  it('transition, progress=1.0 -> equals pure adjacent ritu score', () => {
    const food = makeAyurveda({ hemanta: 0.8, shishira: 0.4 });
    const ctx = makeSeasonal({
      isTransition: true,
      transitionProgress: 1.0,
      adjacentRitu: 'shishira',
      seasonalIntensity: 1.0,
    });
    // blended = 0.0 * 0.8 + 1.0 * 0.4 = 0.4
    expect(seasonalScore(food, ctx)).toBeCloseTo(0.4, 10);
  });

  it('rituFit 0.0 for current ritu, non-transition -> 0.0', () => {
    const food = makeAyurveda({ hemanta: 0.0 });
    const ctx = makeSeasonal({ seasonalIntensity: 1.0 });
    expect(seasonalScore(food, ctx)).toBeCloseTo(0.0, 10);
  });

  it('score in [0, 1] for a range of inputs', () => {
    const ritus: Ritu[] = ['shishira', 'vasanta', 'grishma', 'varsha', 'sharad', 'hemanta'];
    const intensities = [0.3, 0.5, 0.7, 1.0];
    const progresses = [0.0, 0.25, 0.5, 0.75, 1.0];

    for (const ritu of ritus) {
      for (const intensity of intensities) {
        for (const progress of progresses) {
          const food = makeAyurveda({ [ritu]: 0.8, vasanta: 0.3 });
          const ctx = makeSeasonal({
            ayurvedaRitu: ritu,
            isTransition: progress > 0,
            transitionProgress: progress,
            adjacentRitu: 'vasanta',
            seasonalIntensity: intensity,
          });
          const score = seasonalScore(food, ctx);
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(1);
        }
      }
    }
  });
});
