import { describe, expect, it } from 'vitest';
import { computeSuppressionEnd, isSuppressed } from '../suppression.js';
import type { TriggerSuppressionState } from '../types.js';

describe('isSuppressed', () => {
  const now = '2026-04-10T12:00:00Z';
  const future = '2026-04-20T12:00:00Z';
  const past = '2026-04-01T12:00:00Z';

  it('returns true when suppressedUntil is in the future', () => {
    const state: TriggerSuppressionState[] = [
      {
        triggerType: 'stress',
        dismissalType: 'remind_me',
        dismissedAt: now,
        suppressedUntil: future,
      },
    ];
    expect(isSuppressed('stress', state, now)).toBe(true);
  });

  it('returns false when suppressedUntil is in the past', () => {
    const state: TriggerSuppressionState[] = [
      {
        triggerType: 'stress',
        dismissalType: 'remind_me',
        dismissedAt: past,
        suppressedUntil: past,
      },
    ];
    expect(isSuppressed('stress', state, now)).toBe(false);
  });

  it('returns false when suppressedUntil is null (got_it)', () => {
    const state: TriggerSuppressionState[] = [
      {
        triggerType: 'stress',
        dismissalType: 'got_it',
        dismissedAt: now,
        suppressedUntil: null,
      },
    ];
    expect(isSuppressed('stress', state, now)).toBe(false);
  });

  it('returns false when no entry exists for type', () => {
    expect(isSuppressed('stress', [], now)).toBe(false);
  });

  it('only suppresses per trigger type', () => {
    const state: TriggerSuppressionState[] = [
      {
        triggerType: 'stress',
        dismissalType: 'remind_me',
        dismissedAt: now,
        suppressedUntil: future,
      },
    ];
    expect(isSuppressed('stress', state, now)).toBe(true);
    expect(isSuppressed('energy', state, now)).toBe(false);
  });
});

describe('computeSuppressionEnd', () => {
  it("got_it returns null", () => {
    expect(computeSuppressionEnd('got_it', '2026-04-10T12:00:00Z')).toBeNull();
  });
  it('remind_me adds 7 days', () => {
    expect(computeSuppressionEnd('remind_me', '2026-04-10T12:00:00Z')).toBe(
      '2026-04-17T12:00:00Z',
    );
  });
  it('not_interested adds 30 days', () => {
    expect(computeSuppressionEnd('not_interested', '2026-04-10T12:00:00Z')).toBe(
      '2026-05-10T12:00:00Z',
    );
  });
  it('handles month rollover', () => {
    expect(computeSuppressionEnd('remind_me', '2026-02-25T00:00:00Z')).toBe(
      '2026-03-04T00:00:00Z',
    );
  });
});
