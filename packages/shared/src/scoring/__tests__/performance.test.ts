/**
 * Performance tests -- ensures scoreCandidates on 500 foods
 * completes within acceptable time bounds.
 *
 * CI threshold: 50ms. Local target: <10ms.
 */

import { describe, expect, it } from 'vitest';

import { scoreCandidates } from '../score-food.js';
import type { FoodForScoring, SeasonalContext, WeatherContext } from '../types.js';
import { SEASONS, WEATHER_CONDITIONS, buildContext } from './fixtures/contexts.js';
import { CANONICAL_FOODS } from './fixtures/foods.js';
import { PROFILES } from './fixtures/profiles.js';

// ---------------------------------------------------------------------------
// Generate 500 foods from 50 canonical x 10 copies with unique IDs
// ---------------------------------------------------------------------------

function generate500Foods(): FoodForScoring[] {
  const foods: FoodForScoring[] = [];
  for (let copy = 0; copy < 10; copy++) {
    for (const base of CANONICAL_FOODS) {
      foods.push({
        ...base,
        id: `${base.id}-copy-${copy}`,
      });
    }
  }
  return foods;
}

const FOODS_500 = generate500Foods();
const PROFILE = PROFILES['vata-dominant'];
const CONTEXT = buildContext(
  SEASONS.hemanta as SeasonalContext,
  WEATHER_CONDITIONS['cold-windy'] as WeatherContext,
);

describe('performance', () => {
  it('scores 500 foods in under 50ms (CI threshold)', () => {
    // Warmup run -- JIT compile, allocate caches
    scoreCandidates(FOODS_500, PROFILE, CONTEXT);

    const start = performance.now();
    const result = scoreCandidates(FOODS_500, PROFILE, CONTEXT);
    const elapsed = performance.now() - start;

    expect(result.length).toBe(500);
    expect(elapsed).toBeLessThan(50);
  });

  it('repeated scoring shows no timing degradation', () => {
    const RUNS = 10;
    let maxElapsed = 0;

    for (let i = 0; i < RUNS; i++) {
      const start = performance.now();
      scoreCandidates(FOODS_500, PROFILE, CONTEXT);
      const elapsed = performance.now() - start;
      if (elapsed > maxElapsed) maxElapsed = elapsed;
    }

    // No individual run should blow up to over 100ms
    expect(maxElapsed).toBeLessThan(100);
  });

  it('produces deterministic results across runs', () => {
    const resultA = scoreCandidates(FOODS_500, PROFILE, CONTEXT);
    const resultB = scoreCandidates(FOODS_500, PROFILE, CONTEXT);

    expect(resultA.length).toBe(resultB.length);
    for (let i = 0; i < resultA.length; i++) {
      const a = resultA[i];
      const b = resultB[i];
      expect(a?.foodId).toBe(b?.foodId);
      expect(a?.totalScore).toBe(b?.totalScore);
    }
  });
});
