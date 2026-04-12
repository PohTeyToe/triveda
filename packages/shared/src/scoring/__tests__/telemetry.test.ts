import { describe, expect, it } from 'vitest';
import { scoreCandidates } from '../score-food.js';
import { buildTelemetry } from '../telemetry.js';
import {
  CUCUMBER,
  GINGER,
  HEMANTA_CONTEXT,
  OATS,
  RICE,
  VATA_PROFILE,
  generateFoods,
} from './fixtures.js';

// ---------------------------------------------------------------------------
// buildTelemetry
// ---------------------------------------------------------------------------

describe('buildTelemetry', () => {
  const foods = [OATS, GINGER, CUCUMBER, RICE];
  const scored = scoreCandidates(foods, VATA_PROFILE, HEMANTA_CONTEXT);

  it('returns ScoringTelemetry with all required fields', () => {
    const result = buildTelemetry(foods, scored, 0, 42);
    expect(result).toHaveProperty('inputsHash');
    expect(result).toHaveProperty('durationMs');
    expect(result).toHaveProperty('foodCount');
    expect(result).toHaveProperty('filteredCount');
    expect(result).toHaveProperty('scoredCount');
    expect(result).toHaveProperty('topScore');
    expect(result).toHaveProperty('bottomScore');
    expect(result).toHaveProperty('activeCreditsCount');
  });

  it('foodCount matches input foods array length', () => {
    const result = buildTelemetry(foods, scored, 0, 10);
    expect(result.foodCount).toBe(foods.length);
  });

  it('filteredCount is passed through correctly', () => {
    const filteredCount = 2;
    const result = buildTelemetry(foods, scored, filteredCount, 10);
    expect(result.filteredCount).toBe(filteredCount);
    expect(result.scoredCount).toBe(scored.length);
    // The relationship: foodCount = filteredCount + scoredCount
    // holds when the caller computes filteredCount = foods.length - eligible.length
    // Here we pass an artificial filteredCount=2 with scored.length=4
    expect(result.scoredCount).toBe(4);
  });

  it('topScore >= bottomScore', () => {
    const result = buildTelemetry(foods, scored, 0, 10);
    expect(result.topScore).toBeGreaterThanOrEqual(result.bottomScore);
  });

  it('durationMs is non-negative number', () => {
    const result = buildTelemetry(foods, scored, 0, 42);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(typeof result.durationMs).toBe('number');
  });

  it('inputsHash is a string', () => {
    const result = buildTelemetry(foods, scored, 0, 42);
    expect(typeof result.inputsHash).toBe('string');
    expect(result.inputsHash.length).toBeGreaterThan(0);
  });

  it('inputsHash is deterministic (same inputs -> same hash)', () => {
    const a = buildTelemetry(foods, scored, 0, 42);
    const b = buildTelemetry(foods, scored, 0, 42);
    expect(a.inputsHash).toBe(b.inputsHash);
  });

  it('different inputs -> different inputsHash', () => {
    const a = buildTelemetry(foods, scored, 0, 42);
    const b = buildTelemetry(foods, scored, 0, 99); // different duration
    expect(a.inputsHash).not.toBe(b.inputsHash);
  });

  it('activeCreditsCount is non-negative integer', () => {
    const result = buildTelemetry(foods, scored, 0, 10);
    expect(Number.isInteger(result.activeCreditsCount)).toBe(true);
    expect(result.activeCreditsCount).toBeGreaterThanOrEqual(0);
  });

  it('output is JSON-serializable', () => {
    const result = buildTelemetry(foods, scored, 0, 10);
    expect(() => JSON.stringify(result)).not.toThrow();
  });

  it('empty scored array produces zero scores and zero active credits', () => {
    const result = buildTelemetry(foods, [], 4, 5);
    expect(result.topScore).toBe(0);
    expect(result.bottomScore).toBe(0);
    expect(result.activeCreditsCount).toBe(0);
    expect(result.scoredCount).toBe(0);
  });

  it('works with 50 foods', () => {
    const bigFoods = generateFoods(50);
    const bigScored = scoreCandidates(bigFoods, VATA_PROFILE, HEMANTA_CONTEXT);
    const result = buildTelemetry(bigFoods, bigScored, 0, 100);
    expect(result.foodCount).toBe(50);
    expect(result.scoredCount).toBe(50);
  });
});
