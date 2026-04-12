import { describe, expect, it } from 'vitest';
import { antiRepetitionScore, daysBetween } from '../../factors/anti-repetition.js';
import type { FoodFeedback } from '../../types.js';

describe('daysBetween', () => {
  it('5 days apart', () => {
    expect(daysBetween('2026-01-15', '2026-01-10')).toBe(5);
  });

  it('2 days apart across month boundary', () => {
    expect(daysBetween('2026-02-01', '2026-01-30')).toBe(2);
  });

  it('same date -> 0', () => {
    expect(daysBetween('2026-03-15', '2026-03-15')).toBe(0);
  });

  it('order does not matter (absolute difference)', () => {
    expect(daysBetween('2026-01-10', '2026-01-15')).toBe(5);
  });

  it('across year boundary', () => {
    expect(daysBetween('2026-01-01', '2025-12-31')).toBe(1);
  });

  it('leap year February', () => {
    // 2024 is a leap year
    expect(daysBetween('2024-03-01', '2024-02-28')).toBe(2); // Feb 28 -> Feb 29 -> Mar 1
  });

  it('non-leap year February', () => {
    // 2025 is not a leap year
    expect(daysBetween('2025-03-01', '2025-02-28')).toBe(1);
  });
});

describe('antiRepetitionScore', () => {
  const today = '2026-04-10';

  it('food not in recentFoods -> 1.0', () => {
    const recent: FoodFeedback[] = [
      { foodId: 'other-food', date: '2026-04-09', response: 'accepted' },
    ];
    expect(antiRepetitionScore('test-food', recent, today)).toBe(1.0);
  });

  it('accepted yesterday (daysAgo=1) -> 0.1', () => {
    const recent: FoodFeedback[] = [
      { foodId: 'test-food', date: '2026-04-09', response: 'accepted' },
    ];
    expect(antiRepetitionScore('test-food', recent, today)).toBe(0.1);
  });

  it('accepted 2 days ago -> 0.4', () => {
    const recent: FoodFeedback[] = [
      { foodId: 'test-food', date: '2026-04-08', response: 'accepted' },
    ];
    expect(antiRepetitionScore('test-food', recent, today)).toBe(0.4);
  });

  it('accepted 5 days ago -> 0.7', () => {
    const recent: FoodFeedback[] = [
      { foodId: 'test-food', date: '2026-04-05', response: 'accepted' },
    ];
    expect(antiRepetitionScore('test-food', recent, today)).toBe(0.7);
  });

  it('accepted 8 days ago -> 1.0 (beyond all decay steps)', () => {
    const recent: FoodFeedback[] = [
      { foodId: 'test-food', date: '2026-04-02', response: 'accepted' },
    ];
    expect(antiRepetitionScore('test-food', recent, today)).toBe(1.0);
  });

  it('rejected yesterday -> 0.0', () => {
    const recent: FoodFeedback[] = [
      { foodId: 'test-food', date: '2026-04-09', response: 'rejected' },
    ];
    expect(antiRepetitionScore('test-food', recent, today)).toBe(0.0);
  });

  it('rejected 13 days ago -> 0.0 (within 14-day window)', () => {
    const recent: FoodFeedback[] = [
      { foodId: 'test-food', date: '2026-03-28', response: 'rejected' },
    ];
    expect(antiRepetitionScore('test-food', recent, today)).toBe(0.0);
  });

  it('rejected 15 days ago -> 1.0 (past 14-day window)', () => {
    const recent: FoodFeedback[] = [
      { foodId: 'test-food', date: '2026-03-26', response: 'rejected' },
    ];
    expect(antiRepetitionScore('test-food', recent, today)).toBe(1.0);
  });

  it('accepted yesterday then rejected today -> 0.0 (most recent wins)', () => {
    const recent: FoodFeedback[] = [
      { foodId: 'test-food', date: '2026-04-09', response: 'accepted' },
      { foodId: 'test-food', date: '2026-04-10', response: 'rejected' },
    ];
    // Most recent is the rejection on today (daysAgo=0, < 14)
    expect(antiRepetitionScore('test-food', recent, today)).toBe(0.0);
  });

  it('rejected 10 days ago then accepted 5 days ago -> 0.7 (most recent wins)', () => {
    const recent: FoodFeedback[] = [
      { foodId: 'test-food', date: '2026-03-31', response: 'rejected' },
      { foodId: 'test-food', date: '2026-04-05', response: 'accepted' },
    ];
    // Most recent is acceptance 5 days ago -> decay step maxDays=7 -> 0.7
    expect(antiRepetitionScore('test-food', recent, today)).toBe(0.7);
  });

  it('empty recentFoods -> 1.0 for all foods', () => {
    expect(antiRepetitionScore('any-food', [], today)).toBe(1.0);
  });

  it('score in [0, 1] for varied inputs', () => {
    const responses: Array<'accepted' | 'rejected' | 'ignored'> = [
      'accepted',
      'rejected',
      'ignored',
    ];
    for (let daysAgo = 0; daysAgo <= 20; daysAgo++) {
      for (const response of responses) {
        // Compute the date `daysAgo` days before today using daysBetween as a sanity reference
        const d = new Date(2026, 3, 10); // April 10, 2026
        d.setDate(d.getDate() - daysAgo);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const recent: FoodFeedback[] = [{ foodId: 'test', date: dateStr, response }];
        const score = antiRepetitionScore('test', recent, today);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      }
    }
  });
});
