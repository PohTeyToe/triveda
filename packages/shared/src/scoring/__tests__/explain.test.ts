import { describe, expect, it } from 'vitest';
import { explainScore } from '../explain.js';
import { scoreFood } from '../score-food.js';
import {
  CONTEXT_WITH_HISTORY,
  CUCUMBER,
  FULL_MODIFIERS,
  HEMANTA_CONTEXT,
  MINIMAL_PROFILE,
  OATS,
  VATA_PROFILE,
} from './fixtures.js';

/** Find a factor by name, throws if not found (avoids non-null assertion) */
function findFactor(
  factors: Array<{
    name: string;
    weight: number;
    rawScore: number;
    weightedScore: number;
    attribution: number;
    rationale: string;
  }>,
  name: string,
) {
  const found = factors.find((f) => f.name === name);
  if (!found) throw new Error(`Factor ${name} not found`);
  return found;
}

// ---------------------------------------------------------------------------
// explainScore
// ---------------------------------------------------------------------------

describe('explainScore', () => {
  const scored = scoreFood(OATS, VATA_PROFILE, HEMANTA_CONTEXT);

  it('returns ScoreBreakdown with all required fields', () => {
    const result = explainScore(scored, VATA_PROFILE, HEMANTA_CONTEXT);
    expect(result.foodId).toBe(OATS.id);
    expect(result.foodName).toBe(OATS.name);
    expect(typeof result.totalScore).toBe('number');
    expect(typeof result.baseScore).toBe('number');
    expect(result.factors).toBeDefined();
    expect(result.modifiers).toBeDefined();
    expect(result.credits).toBeDefined();
  });

  it('factors array has 6 entries with correct names', () => {
    const result = explainScore(scored, VATA_PROFILE, HEMANTA_CONTEXT);
    expect(result.factors).toHaveLength(6);

    const names = result.factors.map((f) => f.name);
    expect(names).toContain('Constitutional Fit');
    expect(names).toContain('Seasonal Fit');
    expect(names).toContain('Weather Alignment');
    expect(names).toContain('Element Affinity');
    expect(names).toContain('Anti-Repetition');
    expect(names).toContain('Organ Clock');
  });

  it('attribution is weight * (rawScore - 0.5) for each factor', () => {
    const result = explainScore(scored, VATA_PROFILE, HEMANTA_CONTEXT);
    for (const f of result.factors) {
      expect(f.attribution).toBeCloseTo(f.weight * (f.rawScore - 0.5), 10);
    }
  });

  it('positive attribution for rawScore > 0.5 (factor helped)', () => {
    const result = explainScore(scored, VATA_PROFILE, HEMANTA_CONTEXT);
    const constitutional = findFactor(result.factors, 'Constitutional Fit');
    // Oats with Vata-dominant profile should have rawScore > 0.5
    expect(constitutional.rawScore).toBeGreaterThan(0.5);
    expect(constitutional.attribution).toBeGreaterThan(0);
  });

  it('negative attribution for rawScore < 0.5 (factor hurt)', () => {
    // Cucumber in hemanta (cold season, cooling food) should have low seasonal
    const cucumberScored = scoreFood(CUCUMBER, VATA_PROFILE, HEMANTA_CONTEXT);
    const result = explainScore(cucumberScored, VATA_PROFILE, HEMANTA_CONTEXT);
    const seasonal = findFactor(result.factors, 'Seasonal Fit');
    // Cucumber rituFit.hemanta = 0.2, seasonalIntensity=1.0 => score=0.2
    expect(seasonal.rawScore).toBeLessThan(0.5);
    expect(seasonal.attribution).toBeLessThan(0);
  });

  it('rationale strings are non-empty for all 6 factors', () => {
    const result = explainScore(scored, VATA_PROFILE, HEMANTA_CONTEXT);
    for (const f of result.factors) {
      expect(f.rationale.length).toBeGreaterThan(0);
    }
  });

  it('constitutional rationale mentions dosha name', () => {
    const result = explainScore(scored, VATA_PROFILE, HEMANTA_CONTEXT);
    const constitutional = findFactor(result.factors, 'Constitutional Fit');
    expect(constitutional.rationale).toMatch(/Vata|Pitta|Kapha/);
  });

  it('seasonal rationale mentions ritu name', () => {
    const result = explainScore(scored, VATA_PROFILE, HEMANTA_CONTEXT);
    const seasonal = findFactor(result.factors, 'Seasonal Fit');
    expect(seasonal.rationale).toContain('hemanta');
  });

  it('anti-repetition rationale for score 1.0 contains Not recently', () => {
    const result = explainScore(scored, VATA_PROFILE, HEMANTA_CONTEXT);
    const antiRep = findFactor(result.factors, 'Anti-Repetition');
    expect(antiRep.rationale).toContain('Not recently');
  });

  it('anti-repetition rationale for score 0.0 contains Rejected or excluded', () => {
    // Cucumber was rejected in CONTEXT_WITH_HISTORY
    const cucumberScored = scoreFood(CUCUMBER, VATA_PROFILE, CONTEXT_WITH_HISTORY);
    const result = explainScore(cucumberScored, VATA_PROFILE, CONTEXT_WITH_HISTORY);
    const antiRep = findFactor(result.factors, 'Anti-Repetition');
    expect(antiRep.rationale).toMatch(/Rejected|excluded/);
  });

  it('modifiers array has entries for all 3 modifier types', () => {
    const scoredWithMods = scoreFood(OATS, VATA_PROFILE, HEMANTA_CONTEXT, FULL_MODIFIERS);
    const result = explainScore(scoredWithMods, VATA_PROFILE, HEMANTA_CONTEXT);
    expect(result.modifiers).toHaveLength(3);
    const names = result.modifiers.map((m) => m.name);
    expect(names).toContain('bloodWork');
    expect(names).toContain('culturalMatch');
    expect(names).toContain('dailyCheckIn');
  });

  it('credits array has 22 entries (passed through from ScoredFood)', () => {
    const result = explainScore(scored, VATA_PROFILE, HEMANTA_CONTEXT);
    expect(result.credits).toHaveLength(22);
  });

  it('element rationale says "not yet available" when profile has no elements', () => {
    const minScored = scoreFood(OATS, MINIMAL_PROFILE, HEMANTA_CONTEXT);
    const result = explainScore(minScored, MINIMAL_PROFILE, HEMANTA_CONTEXT);
    const element = findFactor(result.factors, 'Element Affinity');
    expect(element.rationale).toContain('not yet available');
  });

  it('snapshot: explainScore on canonical ScoredFood has expected shape', () => {
    const result = explainScore(scored, VATA_PROFILE, HEMANTA_CONTEXT);

    // Shape check
    expect(typeof result.foodId).toBe('string');
    expect(typeof result.foodName).toBe('string');
    expect(typeof result.totalScore).toBe('number');
    expect(typeof result.baseScore).toBe('number');
    expect(Array.isArray(result.factors)).toBe(true);
    expect(Array.isArray(result.modifiers)).toBe(true);
    expect(Array.isArray(result.credits)).toBe(true);

    // Each factor has correct structure
    for (const f of result.factors) {
      expect(typeof f.name).toBe('string');
      expect(typeof f.weight).toBe('number');
      expect(typeof f.rawScore).toBe('number');
      expect(typeof f.weightedScore).toBe('number');
      expect(typeof f.attribution).toBe('number');
      expect(typeof f.rationale).toBe('string');
    }
  });
});
