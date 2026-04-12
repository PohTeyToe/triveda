/**
 * Temporal API helpers.
 *
 * Uses temporal-polyfill for timezone-aware date/time operations.
 * Pure functions -- no IO or side effects.
 */

import { Temporal } from 'temporal-polyfill';

/**
 * Convert a JS Date and IANA timezone string to a Temporal.ZonedDateTime.
 *
 * Used by API handlers when receiving Date objects from request payloads.
 */
export function fromDate(date: Date, tz: string): Temporal.ZonedDateTime {
  const instant = Temporal.Instant.fromEpochMilliseconds(date.getTime());
  return instant.toZonedDateTimeISO(tz);
}

/**
 * Extract day-of-year (1-365 or 1-366 for leap years) from a PlainDate.
 */
export function getDayOfYear(date: Temporal.PlainDate): number {
  return date.dayOfYear;
}

/**
 * Check if the year of a PlainDate is a leap year.
 */
export function isLeapYear(date: Temporal.PlainDate): boolean {
  return date.inLeapYear;
}

/**
 * Clamp a numeric value to [min, max].
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
