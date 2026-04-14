import { describe, expect, it } from 'vitest';
import { computeSeverity, rankBySeverity } from '../severity.js';
import type { TriggerCandidate } from '../types.js';

function mkCandidate(
  type: TriggerCandidate['type'],
  severity: number,
): TriggerCandidate {
  return {
    type,
    severity,
    recommendation: { title: '', body: '', tradition: '' },
    matchingCheckIns: [],
    creditSources: [],
  };
}

describe('computeSeverity', () => {
  it('(4, 3, 0.8) = 0.8', () => {
    expect(computeSeverity(4, 3, 0.8)).toBeCloseTo(0.8);
  });
  it('(5, 3, 0.9) = 1.8', () => {
    expect(computeSeverity(5, 3, 0.9)).toBeCloseTo(1.8);
  });
  it('(3, 3, 1.0) = 0.0', () => {
    expect(computeSeverity(3, 3, 1.0)).toBe(0);
  });
  it('(2, 3, 1.0) = 0.0 (defensive)', () => {
    expect(computeSeverity(2, 3, 1.0)).toBe(0);
  });
});

describe('rankBySeverity', () => {
  it('sorts by severity descending', () => {
    const list = [mkCandidate('stress', 0.5), mkCandidate('energy', 1.5), mkCandidate('sleep', 1.0)];
    const ranked = rankBySeverity(list);
    expect(ranked.map((c) => c.type)).toEqual(['energy', 'sleep', 'stress']);
  });

  it('breaks ties by weight descending (sleep > energy > stress > digestive)', () => {
    const list = [
      mkCandidate('digestive', 1.0),
      mkCandidate('sleep', 1.0),
      mkCandidate('stress', 1.0),
      mkCandidate('energy', 1.0),
    ];
    const ranked = rankBySeverity(list);
    expect(ranked.map((c) => c.type)).toEqual(['sleep', 'energy', 'stress', 'digestive']);
  });

  it('does not mutate input array', () => {
    const list = [mkCandidate('stress', 0.1), mkCandidate('sleep', 2.0)];
    const original = [...list];
    rankBySeverity(list);
    expect(list).toEqual(original);
  });
});
