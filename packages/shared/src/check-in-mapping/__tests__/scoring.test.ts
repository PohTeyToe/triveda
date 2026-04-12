import { describe, expect, it } from 'vitest';
import type { DailyCheckInAnswer } from '../../inputs/types.js';
import { getCheckInAdjustment } from '../scoring.js';

function makeAnswer(overrides: Partial<DailyCheckInAnswer> = {}): DailyCheckInAnswer {
  return {
    date: '2026-04-12',
    selections: {},
    dismissed: false,
    synced: false,
    ...overrides,
  };
}

describe('getCheckInAdjustment', () => {
  it('returns null when answer is null', () => {
    expect(getCheckInAdjustment(null)).toBeNull();
  });

  it('returns null when answer is dismissed', () => {
    const answer = makeAnswer({
      selections: { energy: 'left' },
      dismissed: true,
    });
    expect(getCheckInAdjustment(answer)).toBeNull();
  });

  it('returns null when all selections are null', () => {
    const answer = makeAnswer({
      selections: { energy: null, anxiety: null },
    });
    expect(getCheckInAdjustment(answer)).toBeNull();
  });

  it('returns delta when at least one chip is selected', () => {
    const answer = makeAnswer({ selections: { energy: 'left' } });
    const result = getCheckInAdjustment(answer);
    expect(result).not.toBeNull();
    expect(result?.vata).toBeCloseTo(0.08);
    expect(result?.pitta).toBeCloseTo(0);
    expect(result?.kapha).toBeCloseTo(0);
  });

  it('returns clamped values for extreme selections', () => {
    const selections: Record<string, 'left'> = {
      energy: 'left',
      anxiety: 'left',
      digestion: 'left',
      temperature: 'left',
      rest: 'left',
      appetite: 'left',
    };
    const result = getCheckInAdjustment(makeAnswer({ selections }));
    expect(result).not.toBeNull();
    expect(result?.vata).toBeLessThanOrEqual(0.1);
    expect(result?.pitta).toBeLessThanOrEqual(0.1);
    expect(result?.kapha).toBeLessThanOrEqual(0.1);
  });
});
