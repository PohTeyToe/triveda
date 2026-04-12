/**
 * Shared counting logic for trigger rules.
 *
 * Counts matching check-ins within a time window.
 */

import type { DailyCheckIn, TriggerType } from './types.js';

export interface CountResult {
  count: number;
  total: number;
  matching: DailyCheckIn[];
}

/**
 * Count check-ins within a window that match a field value.
 *
 * For the sleep trigger type, check-ins without a sleepQuality value
 * are excluded from both count and total.
 *
 * @param checkIns - All recent check-ins
 * @param field - Which DailyCheckIn field to check
 * @param matchValues - Values that count as a match
 * @param now - ISO date string (YYYY-MM-DD or full ISO datetime)
 * @param windowDays - Number of days in the counting window
 * @param triggerType - The trigger type (for sleep special handling)
 */
export function countMatchingCheckIns(
  checkIns: DailyCheckIn[],
  field: keyof DailyCheckIn,
  matchValues: string[],
  now: string,
  windowDays: number,
  triggerType?: TriggerType,
): CountResult {
  const nowDate = now.slice(0, 10);
  const windowStart = subtractDays(nowDate, windowDays);

  const matching: DailyCheckIn[] = [];
  let total = 0;

  for (const ci of checkIns) {
    // Only include check-ins within the window
    if (ci.date < windowStart || ci.date > nowDate) continue;

    // For sleep rule: skip check-ins without sleepQuality
    if (triggerType === 'sleep' && field === 'sleepQuality') {
      if (ci.sleepQuality === undefined || ci.sleepQuality === null) continue;
    }

    total += 1;

    const value = ci[field];
    if (typeof value === 'string' && matchValues.includes(value)) {
      matching.push(ci);
    }
  }

  return { count: matching.length, total, matching };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Subtract days from an ISO date string (YYYY-MM-DD).
 * Returns YYYY-MM-DD string.
 */
function subtractDays(dateStr: string, days: number): string {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  let year = Number.parseInt(yearStr as string, 10);
  let month = Number.parseInt(monthStr as string, 10);
  let day = Number.parseInt(dayStr as string, 10);

  day -= days;

  while (day < 1) {
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    day += getDaysInMonth(year, month);
  }

  const yy = String(year).padStart(4, '0');
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');

  return `${yy}-${mm}-${dd}`;
}

function getDaysInMonth(year: number, month: number): number {
  const daysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 2 && isLeapYear(year)) return 29;
  return daysInMonth[month] as number;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}
