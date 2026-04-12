/**
 * Integration smoke tests -- full pipeline from raw food data
 * through scoring to ranked output.
 *
 * Three scenarios: complete flow, zero-answer profile (progressive
 * profiling), and all-foods-filtered edge case.
 */

import { describe, expect, it } from 'vitest';

import { explainScore } from '../explain.js';
import { filterCandidates } from '../filters/index.js';
import { scoreCandidates } from '../score-food.js';
import { selectTopN } from '../select-top-n.js';
import { buildTelemetry } from '../telemetry.js';
import type { ScoringContext, SeasonalContext, WeatherContext } from '../types.js';
import { SEASONS, WEATHER_CONDITIONS, buildContext } from './fixtures/contexts.js';
import { CANONICAL_FOODS } from './fixtures/foods.js';
import { PROFILES } from './fixtures/profiles.js';

describe('integration: complete scoring flow', () => {
  const profile = PROFILES['full-18'];
  const context: ScoringContext = {
    ...buildContext(
      SEASONS.hemanta as SeasonalContext,
      WEATHER_CONDITIONS['cold-windy'] as WeatherContext,
    ),
    recentFoods: [
      { foodId: 'f0000000-0000-0000-0000-000000000001', date: '2026-01-14', response: 'accepted' },
      { foodId: 'f0000000-0000-0000-0000-000000000041', date: '2026-01-13', response: 'accepted' },
      { foodId: 'f0000000-0000-0000-0000-000000000050', date: '2026-01-10', response: 'rejected' },
    ],
    dietaryRestrictions: ['dairy'],
  };

  it('end-to-end pipeline produces valid output', () => {
    // Step 1: Filter candidates
    const filtered = filterCandidates(CANONICAL_FOODS, context);
    expect(filtered.length).toBeLessThan(CANONICAL_FOODS.length);
    // Dairy-tagged foods should be removed
    for (const f of filtered) {
      expect(f.tags).not.toContain('dairy');
    }

    // Step 2: Score candidates
    const scored = scoreCandidates(CANONICAL_FOODS, profile, context);
    // scoreCandidates filters internally, so scored count matches filtered
    expect(scored.length).toBe(filtered.length);

    // Step 3: Select top 3
    const top3 = selectTopN(scored, 3);
    expect(top3.length).toBe(3);

    // Step 4: Top food has highest totalScore
    expect(top3[0]?.totalScore).toBeGreaterThanOrEqual(top3[1]?.totalScore ?? 0);
    expect(top3[0]?.totalScore).toBeGreaterThanOrEqual(top3[2]?.totalScore ?? 0);

    // Step 5: explainScore produces valid ScoreBreakdown shape
    const topFood = top3[0];
    expect(topFood).toBeDefined();
    const explanation = explainScore(topFood as NonNullable<typeof topFood>, profile, context);
    expect(explanation.foodId).toBe(topFood?.foodId);
    expect(explanation.foodName).toBe(topFood?.foodName);
    expect(explanation.totalScore).toBe(topFood?.totalScore);
    expect(explanation.baseScore).toBe(topFood?.baseScore);
    expect(explanation.factors).toHaveLength(6);
    expect(explanation.modifiers).toHaveLength(3);
    expect(explanation.credits).toHaveLength(22);

    // Each factor has expected fields
    for (const factor of explanation.factors) {
      expect(factor).toHaveProperty('name');
      expect(factor).toHaveProperty('weight');
      expect(factor).toHaveProperty('rawScore');
      expect(factor).toHaveProperty('weightedScore');
      expect(factor).toHaveProperty('attribution');
      expect(factor).toHaveProperty('rationale');
    }

    // Step 6: Credits - at least 6 active (core always-on features)
    const activeCredits = topFood?.credits.filter((c) => c.active) ?? [];
    expect(activeCredits.length).toBeGreaterThanOrEqual(6);

    // Step 7: Telemetry
    const telemetry = buildTelemetry(
      CANONICAL_FOODS,
      scored,
      CANONICAL_FOODS.length - scored.length,
      1.5,
    );
    expect(telemetry.foodCount).toBe(CANONICAL_FOODS.length);
    expect(telemetry.scoredCount).toBe(scored.length);
    expect(telemetry.filteredCount).toBe(CANONICAL_FOODS.length - scored.length);
    expect(telemetry.topScore).toBe(scored[0]?.totalScore);
    expect(telemetry.durationMs).toBe(1.5);
    expect(typeof telemetry.inputsHash).toBe('string');
    expect(typeof telemetry.activeCreditsCount).toBe('number');

    // Step 8: Entire flow completed without exceptions (implicit)
  });
});

describe('integration: zero-answer profile (progressive profiling)', () => {
  const profile = PROFILES['zero-answers'];
  const context = buildContext(
    SEASONS.hemanta as SeasonalContext,
    WEATHER_CONDITIONS['mild-neutral'] as WeatherContext,
  );

  it('produces valid results with degraded precision', () => {
    const scored = scoreCandidates(CANONICAL_FOODS, profile, context);
    expect(scored.length).toBe(CANONICAL_FOODS.length);

    // All foods should be scored (no restrictions)
    const top3 = selectTopN(scored, 3);
    expect(top3.length).toBe(3);

    // Element scores should be at neutral (0.5) since no elements
    for (const food of scored) {
      expect(food.breakdown.element.rawScore).toBeCloseTo(0.5, 5);
    }

    // Credits: element credit should be latent
    const topFood = top3[0];
    expect(topFood).toBeDefined();
    const elementCredit = topFood?.credits.find(
      (c) => c.featureId === 'five-element-affinity' || c.featureId === 'face-scan-data',
    );
    if (elementCredit) {
      expect(elementCredit.active).toBe(false);
    }
  });
});

describe('integration: all foods filtered', () => {
  it('handles empty candidate set without crash', () => {
    const profile = PROFILES['vata-dominant'];

    // Build a context where all food tags are restricted
    const allTags = new Set<string>();
    for (const food of CANONICAL_FOODS) {
      for (const tag of food.tags) {
        allTags.add(tag);
      }
    }

    const context: ScoringContext = {
      ...buildContext(
        SEASONS.hemanta as SeasonalContext,
        WEATHER_CONDITIONS['cold-windy'] as WeatherContext,
      ),
      dietaryRestrictions: [...allTags],
    };

    const scored = scoreCandidates(CANONICAL_FOODS, profile, context);
    expect(scored).toEqual([]);
    // No crash -- test passes by completing
  });
});
