import { describe, expect, it } from 'vitest';
import { FACTOR_WEIGHTS, SCORE_CLAMP } from '../factors/constants.js';
import { scoreCandidates, scoreFood } from '../score-food.js';
import {
  CONTEXT_WITH_HISTORY,
  CUCUMBER,
  FULL_MODIFIERS,
  GINGER,
  HEMANTA_CONTEXT,
  MILK,
  MINIMAL_PROFILE,
  NO_MODIFIERS,
  OATS,
  RESTRICTED_CONTEXT,
  RICE,
  VATA_PROFILE,
  generateFoods,
} from './fixtures.js';

// ---------------------------------------------------------------------------
// scoreFood
// ---------------------------------------------------------------------------

describe('scoreFood', () => {
  it('hand-computed full scoring scenario', () => {
    // Vata-dominant (0.6/0.25/0.15), hemanta, warm weather need (0.8),
    // stomach hour, no recent foods, no modifiers
    const result = scoreFood(OATS, VATA_PROFILE, HEMANTA_CONTEXT);

    // constitutional: (-(-1)*0.6 + -(0)*0.25 + -(1)*0.15) = (0.6 + 0 - 0.15) = 0.45
    //   normalized: (0.45 + 2) / 4 = 0.6125
    // seasonal: rituFit.hemanta = 0.7, intensity=1.0 => 0.7
    // weather: thermalNeed=0.8, food warm=0.5 => 1.0 - |0.8-0.5|/2 = 1.0 - 0.15 = 0.85
    // element: earth=0.8*0.7 + water=0.4*0.3 = 0.56+0.12 = 0.68
    // antiRepetition: 1.0 (no recent)
    // organClock: stomach in organAffinity => 1.0
    //
    // baseScore = 0.6125*0.30 + 0.7*0.20 + 0.85*0.15 + 0.68*0.15 + 1.0*0.12 + 1.0*0.08
    //           = 0.18375 + 0.14 + 0.1275 + 0.102 + 0.12 + 0.08
    //           = 0.75325

    expect(result.baseScore).toBeCloseTo(0.7533, 3);
    expect(result.totalScore).toBeCloseTo(0.7533, 3); // no modifiers
  });

  it('baseScore is sum of 6 weighted factor scores', () => {
    const result = scoreFood(OATS, VATA_PROFILE, HEMANTA_CONTEXT);
    const bd = result.breakdown;
    const expectedBase =
      bd.constitutional.weightedScore +
      bd.seasonal.weightedScore +
      bd.weather.weightedScore +
      bd.element.weightedScore +
      bd.antiRepetition.weightedScore +
      bd.organClock.weightedScore;

    expect(result.baseScore).toBeCloseTo(expectedBase, 10);
  });

  it('totalScore equals baseScore when no modifiers', () => {
    const result = scoreFood(OATS, VATA_PROFILE, HEMANTA_CONTEXT);
    expect(result.totalScore).toBe(result.baseScore);
  });

  it('totalScore equals baseScore * compositeModifier when modifiers provided', () => {
    const result = scoreFood(OATS, VATA_PROFILE, HEMANTA_CONTEXT, FULL_MODIFIERS);
    // composite = 1.05 * 1.03 * 1.02 = 1.10313
    const expectedTotal = result.baseScore * 1.05 * 1.03 * 1.02;
    expect(result.totalScore).toBeCloseTo(
      Math.max(SCORE_CLAMP.min, Math.min(SCORE_CLAMP.max, expectedTotal)),
      4,
    );
  });

  it('totalScore clamped to [0, 1.2] even with extreme modifiers', () => {
    // Use a food that scores high with an extreme modifier scenario
    const extremeMods = { bloodWork: 1.2, culturalMatch: 1.1, dailyCheckIn: 1.1 };
    const result = scoreFood(OATS, VATA_PROFILE, HEMANTA_CONTEXT, extremeMods);
    expect(result.totalScore).toBeLessThanOrEqual(SCORE_CLAMP.max);
    expect(result.totalScore).toBeGreaterThanOrEqual(SCORE_CLAMP.min);
  });

  it('baseScore clamped to [0, 1.0]', () => {
    const result = scoreFood(OATS, VATA_PROFILE, HEMANTA_CONTEXT);
    expect(result.baseScore).toBeGreaterThanOrEqual(0);
    expect(result.baseScore).toBeLessThanOrEqual(1.0);
  });

  it('breakdown contains all 6 factors with correct locked weights', () => {
    const result = scoreFood(OATS, VATA_PROFILE, HEMANTA_CONTEXT);
    const bd = result.breakdown;

    expect(bd.constitutional.weight).toBe(FACTOR_WEIGHTS.constitutional);
    expect(bd.seasonal.weight).toBe(FACTOR_WEIGHTS.seasonal);
    expect(bd.weather.weight).toBe(FACTOR_WEIGHTS.weather);
    expect(bd.element.weight).toBe(FACTOR_WEIGHTS.element);
    expect(bd.antiRepetition.weight).toBe(FACTOR_WEIGHTS.antiRepetition);
    expect(bd.organClock.weight).toBe(FACTOR_WEIGHTS.organClock);
  });

  it('sum of all breakdown weights === 1.0', () => {
    const result = scoreFood(OATS, VATA_PROFILE, HEMANTA_CONTEXT);
    const bd = result.breakdown;
    const sum =
      bd.constitutional.weight +
      bd.seasonal.weight +
      bd.weather.weight +
      bd.element.weight +
      bd.antiRepetition.weight +
      bd.organClock.weight;
    expect(sum).toBeCloseTo(1.0, 10);
  });

  it('each breakdown weightedScore === weight * rawScore', () => {
    const result = scoreFood(OATS, VATA_PROFILE, HEMANTA_CONTEXT);
    const bd = result.breakdown;
    const factors = [
      bd.constitutional,
      bd.seasonal,
      bd.weather,
      bd.element,
      bd.antiRepetition,
      bd.organClock,
    ];
    for (const f of factors) {
      expect(f.weightedScore).toBeCloseTo(f.weight * f.rawScore, 10);
    }
  });

  it('credits array has exactly 22 entries', () => {
    const result = scoreFood(OATS, VATA_PROFILE, HEMANTA_CONTEXT);
    expect(result.credits).toHaveLength(22);
  });

  it('rationale strings are non-empty for each factor', () => {
    const result = scoreFood(OATS, VATA_PROFILE, HEMANTA_CONTEXT);
    const bd = result.breakdown;
    expect(bd.constitutional.rationale.length).toBeGreaterThan(0);
    expect(bd.seasonal.rationale.length).toBeGreaterThan(0);
    expect(bd.weather.rationale.length).toBeGreaterThan(0);
    expect(bd.element.rationale.length).toBeGreaterThan(0);
    expect(bd.antiRepetition.rationale.length).toBeGreaterThan(0);
    expect(bd.organClock.rationale.length).toBeGreaterThan(0);
  });

  it('modifiers array has 3 entries when no modifiers provided', () => {
    const result = scoreFood(OATS, VATA_PROFILE, HEMANTA_CONTEXT);
    expect(result.modifiers).toHaveLength(3);
    expect(result.modifiers.every((m) => !m.applied)).toBe(true);
  });

  it('modifiers array has 3 entries when all modifiers provided', () => {
    const result = scoreFood(OATS, VATA_PROFILE, HEMANTA_CONTEXT, FULL_MODIFIERS);
    expect(result.modifiers).toHaveLength(3);
    expect(result.modifiers.every((m) => m.applied)).toBe(true);
  });

  it('credits reflect actual factor scores from the scoring call', () => {
    const result = scoreFood(OATS, VATA_PROFILE, HEMANTA_CONTEXT);
    // The constitutional credit should be active
    const doshaCredit = result.credits.find((c) => c.featureId === 'dosha-analysis');
    expect(doshaCredit).toBeDefined();
    expect(doshaCredit?.active).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// scoreCandidates
// ---------------------------------------------------------------------------

describe('scoreCandidates', () => {
  it('returns scored foods sorted by totalScore descending', () => {
    const foods = [OATS, GINGER, CUCUMBER, RICE];
    const results = scoreCandidates(foods, VATA_PROFILE, HEMANTA_CONTEXT);

    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1]?.totalScore).toBeGreaterThanOrEqual(results[i]?.totalScore);
    }
  });

  it('applies filterCandidates before scoring (restricted food absent)', () => {
    const foods = [OATS, MILK, RICE]; // MILK has 'dairy' tag
    const results = scoreCandidates(foods, VATA_PROFILE, RESTRICTED_CONTEXT);

    const foodIds = results.map((r) => r.foodId);
    expect(foodIds).not.toContain(MILK.id);
  });

  it('all returned foods have valid ScoredFood shape', () => {
    const foods = [OATS, GINGER];
    const results = scoreCandidates(foods, VATA_PROFILE, HEMANTA_CONTEXT);

    for (const r of results) {
      expect(r.foodId).toBeDefined();
      expect(r.foodName).toBeDefined();
      expect(typeof r.totalScore).toBe('number');
      expect(typeof r.baseScore).toBe('number');
      expect(r.breakdown).toBeDefined();
      expect(r.modifiers).toBeDefined();
      expect(r.credits).toBeDefined();
      expect(r.credits).toHaveLength(22);
    }
  });

  it('empty input array -> empty output', () => {
    const results = scoreCandidates([], VATA_PROFILE, HEMANTA_CONTEXT);
    expect(results).toHaveLength(0);
  });

  it('single food input -> single scored food output', () => {
    const results = scoreCandidates([OATS], VATA_PROFILE, HEMANTA_CONTEXT);
    expect(results).toHaveLength(1);
    expect(results[0]?.foodId).toBe(OATS.id);
  });

  it('50 foods -> all 50 scored (none filtered, no restrictions)', () => {
    const foods = generateFoods(50);
    const results = scoreCandidates(foods, VATA_PROFILE, HEMANTA_CONTEXT);
    expect(results).toHaveLength(50);
  });

  it('determinism: same inputs produce same output across 10 runs', () => {
    const foods = [OATS, GINGER, CUCUMBER, RICE];
    const firstRun = scoreCandidates(foods, VATA_PROFILE, HEMANTA_CONTEXT);

    for (let i = 0; i < 10; i++) {
      const run = scoreCandidates(foods, VATA_PROFILE, HEMANTA_CONTEXT);
      expect(run.map((r) => r.foodId)).toEqual(firstRun.map((r) => r.foodId));
      expect(run.map((r) => r.totalScore)).toEqual(firstRun.map((r) => r.totalScore));
    }
  });

  it('food rejected within 14 days has totalScore reflecting 0.0 anti-repetition', () => {
    const results = scoreCandidates([CUCUMBER], VATA_PROFILE, CONTEXT_WITH_HISTORY);
    // Cucumber was rejected on 2026-01-10, today is 2026-01-15 (5 days ago, within 14)
    const cucumber = results.find((r) => r.foodId === CUCUMBER.id);
    expect(cucumber).toBeDefined();
    expect(cucumber?.breakdown.antiRepetition.rawScore).toBe(0.0);
  });

  it('ties broken by alphabetical foodId', () => {
    // Create two foods with identical scoring profiles but different IDs
    const foodA = { ...OATS, id: 'f0000000-0000-0000-0000-bbbbbbbbbbb1', name: 'FoodB' };
    const foodB = { ...OATS, id: 'f0000000-0000-0000-0000-aaaaaaaaaa01', name: 'FoodA' };

    const results = scoreCandidates([foodA, foodB], VATA_PROFILE, HEMANTA_CONTEXT);
    // Same scores, so foodB (aaaa...) should come first alphabetically
    expect(results[0]?.foodId).toBe(foodB.id);
    expect(results[1]?.foodId).toBe(foodA.id);
  });
});
