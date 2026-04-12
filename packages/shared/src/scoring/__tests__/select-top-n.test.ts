import { describe, expect, it } from 'vitest';
import { selectTopN } from '../select-top-n.js';
import type { ScoredFood } from '../types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeScoredFood(id: string, totalScore: number): ScoredFood {
  return {
    foodId: id,
    foodName: `Food ${id}`,
    totalScore,
    baseScore: totalScore,
    breakdown: {
      constitutional: { weight: 0.3, rawScore: 0.5, weightedScore: 0.15, rationale: '' },
      seasonal: { weight: 0.2, rawScore: 0.5, weightedScore: 0.1, rationale: '' },
      weather: { weight: 0.15, rawScore: 0.5, weightedScore: 0.075, rationale: '' },
      element: { weight: 0.15, rawScore: 0.5, weightedScore: 0.075, rationale: '' },
      antiRepetition: { weight: 0.12, rawScore: 1.0, weightedScore: 0.12, rationale: '' },
      organClock: { weight: 0.08, rawScore: 0.5, weightedScore: 0.04, rationale: '' },
    },
    modifiers: [],
    credits: [],
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('selectTopN', () => {
  it('selectTopN(5 scored foods, 3) -> top 3 by totalScore', () => {
    const foods = [
      makeScoredFood('e', 0.3),
      makeScoredFood('d', 0.5),
      makeScoredFood('c', 0.7),
      makeScoredFood('b', 0.9),
      makeScoredFood('a', 0.6),
    ];
    const result = selectTopN(foods, 3);
    expect(result).toHaveLength(3);
    expect(result[0]?.foodId).toBe('b'); // 0.9
    expect(result[1]?.foodId).toBe('c'); // 0.7
    expect(result[2]?.foodId).toBe('a'); // 0.6
  });

  it('selectTopN(2 scored foods, 5) -> all 2 (n > count)', () => {
    const foods = [makeScoredFood('a', 0.8), makeScoredFood('b', 0.6)];
    const result = selectTopN(foods, 5);
    expect(result).toHaveLength(2);
  });

  it('selectTopN(0 scored foods, 3) -> empty', () => {
    const result = selectTopN([], 3);
    expect(result).toHaveLength(0);
  });

  it('tied scores broken by alphabetical foodId (lexicographic)', () => {
    const foods = [makeScoredFood('banana', 0.8), makeScoredFood('apple', 0.8)];
    const result = selectTopN(foods, 2);
    expect(result[0]?.foodId).toBe('apple');
    expect(result[1]?.foodId).toBe('banana');
  });

  it('stable ordering across 100 runs with same tied input', () => {
    const foods = [
      makeScoredFood('cherry', 0.75),
      makeScoredFood('banana', 0.75),
      makeScoredFood('apple', 0.75),
    ];
    const firstResult = selectTopN(foods, 3);

    for (let i = 0; i < 100; i++) {
      const result = selectTopN(foods, 3);
      expect(result.map((r) => r.foodId)).toEqual(firstResult.map((r) => r.foodId));
    }
  });

  it('selectTopN(1 food, 1) -> that food', () => {
    const foods = [makeScoredFood('only', 0.5)];
    const result = selectTopN(foods, 1);
    expect(result).toHaveLength(1);
    expect(result[0]?.foodId).toBe('only');
  });
});
