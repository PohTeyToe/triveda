/**
 * Trigger suppression logic.
 *
 * Checks if a trigger is suppressed and computes suppression end dates.
 * Uses ISO 8601 string comparison -- no Date constructor needed.
 */

import { SUPPRESSION_DURATIONS } from './trigger-config.js';
import type { DismissalType, TriggerSuppressionState, TriggerType } from './types.js';

// ---------------------------------------------------------------------------
// isSuppressed
// ---------------------------------------------------------------------------

/**
 * Check if a trigger type is currently suppressed.
 *
 * Finds the entry in suppressionState matching triggerType.
 * If found and suppressedUntil is not null and suppressedUntil > now, returns true.
 * ISO 8601 strings sort lexicographically, so string comparison works.
 */
export function isSuppressed(
  triggerType: TriggerType,
  suppressionState: TriggerSuppressionState[],
  now: string,
): boolean {
  const entry = suppressionState.find((s) => s.triggerType === triggerType);
  if (!entry) return false;
  if (entry.suppressedUntil === null) return false;
  return entry.suppressedUntil > now;
}

// ---------------------------------------------------------------------------
// computeSuppressionEnd
// ---------------------------------------------------------------------------

/**
 * Compute when suppression ends based on dismissal type.
 *
 * - got_it: null (no suppression)
 * - remind_me: now + 7 days
 * - not_interested: now + 30 days
 *
 * Date arithmetic via plain string parsing -- no Date constructor dependency.
 */
export function computeSuppressionEnd(dismissalType: DismissalType, now: string): string | null {
  const days = SUPPRESSION_DURATIONS[dismissalType];
  if (days === 0) return null;

  return addDaysToISOString(now, days);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Add days to an ISO datetime string.
 * Handles month/year rollover correctly.
 */
function addDaysToISOString(isoString: string, days: number): string {
  // Split on 'T' to separate date and time
  const parts = isoString.split('T');
  const datePart = parts[0] as string;
  const timePart = parts[1] ?? '00:00:00Z';

  const [yearStr, monthStr, dayStr] = datePart.split('-');
  let year = Number.parseInt(yearStr as string, 10);
  let month = Number.parseInt(monthStr as string, 10);
  let day = Number.parseInt(dayStr as string, 10);

  day += days;

  // Normalize day/month/year
  while (true) {
    const daysInMonth = getDaysInMonth(year, month);
    if (day <= daysInMonth) break;
    day -= daysInMonth;
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  const yy = String(year).padStart(4, '0');
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');

  return `${yy}-${mm}-${dd}T${timePart}`;
}

function getDaysInMonth(year: number, month: number): number {
  const days = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 2 && isLeapYear(year)) return 29;
  return days[month] as number;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}
