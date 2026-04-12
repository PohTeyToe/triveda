/**
 * Anti-repetition factor -- penalizes recently suggested or rejected foods.
 *
 * Uses a decay curve for accepted foods and a hard 14-day block for
 * rejected foods. Pure date arithmetic with no Date constructor.
 *
 * Pure function, no IO.
 */

import type { FoodFeedback } from '../types.js';
import { DECAY_STEPS, HARD_REJECT_DAYS } from './constants.js';

/**
 * Compute the number of days between two ISO date strings (YYYY-MM-DD).
 *
 * Uses pure arithmetic on year/month/day integers. No Date constructor.
 */
export function daysBetween(dateA: string, dateB: string): number {
  return Math.abs(toJulianDay(dateA) - toJulianDay(dateB));
}

/**
 * Compute anti-repetition score for a food.
 *
 * - Not in recent foods: 1.0
 * - Rejected within HARD_REJECT_DAYS (14): 0.0
 * - Accepted recently: decay curve via DECAY_STEPS
 * - Beyond all thresholds: 1.0
 *
 * @returns A number in [0, 1].
 */
export function antiRepetitionScore(
  foodId: string,
  recentFoods: FoodFeedback[],
  today: string,
): number {
  // Filter to entries matching this food
  const matches = recentFoods.filter((f) => f.foodId === foodId);

  if (matches.length === 0) {
    return 1.0;
  }

  // Sort by date descending (ISO 8601 sorts lexicographically)
  matches.sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0));

  const mostRecent = matches[0];
  const daysAgo = daysBetween(today, mostRecent.date);

  // Hard rejection within window
  if (mostRecent.response === 'rejected' && daysAgo < HARD_REJECT_DAYS) {
    return 0.0;
  }

  // Decay steps for accepted/ignored
  for (const step of DECAY_STEPS) {
    if (daysAgo <= step.maxDays) {
      return step.score;
    }
  }

  return 1.0;
}

// ---------------------------------------------------------------------------
// Internal: Julian Day Number from ISO date string
// ---------------------------------------------------------------------------

/** Days in each month for a non-leap year */
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year: number, month: number): number {
  if (month === 2 && isLeapYear(year)) return 29;
  return DAYS_IN_MONTH[month - 1];
}

/**
 * Convert an ISO date string to a Julian Day Number.
 *
 * This is a simplified day-count (not the astronomical JDN) that
 * produces correct differences between any two dates in the
 * Gregorian calendar.
 */
function toJulianDay(dateStr: string): number {
  const parts = dateStr.split('-');
  const year = Number.parseInt(parts[0], 10);
  const month = Number.parseInt(parts[1], 10);
  const day = Number.parseInt(parts[2], 10);

  // Count days from year 0
  let total = 0;

  // Full years
  const y = year - 1;
  total += y * 365 + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400);

  // Full months in current year
  for (let m = 1; m < month; m++) {
    total += daysInMonth(year, m);
  }

  // Days in current month
  total += day;

  return total;
}
