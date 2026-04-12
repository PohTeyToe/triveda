/**
 * Golden snapshot suite -- 180 fixture combinations run through the
 * full scoring engine. Output is committed as Vitest file snapshots.
 *
 * Any change to scoring logic produces up to 180 reviewable diffs.
 * This is the primary regression safety net for the scoring engine.
 */

import { describe, expect, it } from 'vitest';

import { scoreCandidates } from '../score-food.js';
import { selectTopN } from '../select-top-n.js';
import { CANONICAL_FOODS } from './fixtures/foods.js';
import { goldenCombinations } from './fixtures/golden-combinations.js';

// ---------------------------------------------------------------------------
// Custom snapshot serializer: rounds all numbers to 4 decimal places
// to prevent floating-point noise from causing false failures.
// ---------------------------------------------------------------------------

expect.addSnapshotSerializer({
  test: (val: unknown) => typeof val === 'number',
  serialize: (val: number) => Number(val.toFixed(4)).toString(),
  print: (val: number) => Number(val.toFixed(4)).toString(),
});

// ---------------------------------------------------------------------------
// Golden snapshot tests (10 profiles x 6 seasons x 3 weather = 180)
// ---------------------------------------------------------------------------

describe('golden snapshots', () => {
  it('generates 180 combinations', () => {
    expect(goldenCombinations.length).toBe(180);
  });

  describe.each(goldenCombinations)('$snapshotName', ({ profile, context, snapshotName }) => {
    it('matches snapshot', () => {
      const scored = scoreCandidates(CANONICAL_FOODS, profile, context);
      const top5 = selectTopN(scored, 5);

      // Snapshot only the essential fields to keep diffs readable
      const snapshot = top5.map((s) => ({
        foodId: s.foodId,
        foodName: s.foodName,
        totalScore: s.totalScore,
        baseScore: s.baseScore,
        factors: {
          constitutional: s.breakdown.constitutional.rawScore,
          seasonal: s.breakdown.seasonal.rawScore,
          weather: s.breakdown.weather.rawScore,
          element: s.breakdown.element.rawScore,
          antiRepetition: s.breakdown.antiRepetition.rawScore,
          organClock: s.breakdown.organClock.rawScore,
        },
      }));

      expect(snapshot).toMatchSnapshot(snapshotName);
    });
  });
});
