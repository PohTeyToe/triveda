/**
 * TCM Organ Clock Engine.
 *
 * Maps a timezone-aware datetime to the active organ-meridian system
 * in the 12-organ daily cycle (Zi Wu Liu Zhu / Chinese body clock).
 *
 * Pure function -- no IO or side effects. Runs per-request (time-dependent,
 * never cached). Output feeds the scoring engine (split 04) for organ clock
 * food compatibility and split 12 for triggered-recommendation patterns.
 */

import type { Temporal } from 'temporal-polyfill';
import type { OrganClockContext, OrganClockDebug, OrganClockResult, TCMElement } from './types.js';

// ---------------------------------------------------------------------------
// Legacy interface stubs (from split 01 -- retained for compatibility)
// ---------------------------------------------------------------------------

export interface OrganMeridian {
  organ: string;
  element: 'wood' | 'fire' | 'earth' | 'metal' | 'water';
  startHour: number;
  endHour: number;
}

export interface OrganClock {
  /** Get the active TCM organ meridian for a given time. */
  getActiveOrgan(time: Date): OrganMeridian;
}

// ---------------------------------------------------------------------------
// Clock table
// ---------------------------------------------------------------------------

interface OrganClockEntry {
  startHour: number;
  endHour: number;
  organ: string;
  pair: string;
  element: TCMElement;
}

/**
 * 12-entry constant lookup table for the TCM organ clock.
 *
 * Each entry covers a 2-hour window. The gallbladder entry (23-1) crosses
 * midnight and requires special matching logic.
 */
const ORGAN_CLOCK_TABLE: readonly OrganClockEntry[] = [
  { startHour: 3, endHour: 5, organ: 'lung', pair: 'large_intestine', element: 'metal' },
  { startHour: 5, endHour: 7, organ: 'large_intestine', pair: 'lung', element: 'metal' },
  { startHour: 7, endHour: 9, organ: 'stomach', pair: 'spleen', element: 'earth' },
  { startHour: 9, endHour: 11, organ: 'spleen', pair: 'stomach', element: 'earth' },
  { startHour: 11, endHour: 13, organ: 'heart', pair: 'small_intestine', element: 'fire' },
  { startHour: 13, endHour: 15, organ: 'small_intestine', pair: 'heart', element: 'fire' },
  { startHour: 15, endHour: 17, organ: 'bladder', pair: 'kidney', element: 'water' },
  { startHour: 17, endHour: 19, organ: 'kidney', pair: 'bladder', element: 'water' },
  { startHour: 19, endHour: 21, organ: 'pericardium', pair: 'triple_burner', element: 'fire' },
  { startHour: 21, endHour: 23, organ: 'triple_burner', pair: 'pericardium', element: 'fire' },
  { startHour: 23, endHour: 1, organ: 'gallbladder', pair: 'liver', element: 'wood' },
  { startHour: 1, endHour: 3, organ: 'liver', pair: 'gallbladder', element: 'wood' },
] as const;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get the active TCM organ meridian for a timezone-aware datetime.
 *
 * The same UTC instant produces different organ results in different timezones
 * because the hour is extracted from the wall-clock time in the given timezone.
 */
export function getOrganClock(datetime: Temporal.ZonedDateTime): OrganClockResult {
  const hour = datetime.hour;
  const timezone = datetime.timeZoneId;

  // Find matching entry
  let matchedIndex = -1;
  let matched: OrganClockEntry | undefined;

  for (let i = 0; i < ORGAN_CLOCK_TABLE.length; i++) {
    const entry = ORGAN_CLOCK_TABLE[i];
    if (!entry) continue;

    if (entry.startHour < entry.endHour) {
      // Normal range: match when hour >= start AND hour < end
      if (hour >= entry.startHour && hour < entry.endHour) {
        matched = entry;
        matchedIndex = i;
        break;
      }
    } else {
      // Midnight-crossing range (gallbladder 23-1): match when hour >= start OR hour < end
      if (hour >= entry.startHour || hour < entry.endHour) {
        matched = entry;
        matchedIndex = i;
        break;
      }
    }
  }

  // This should never happen with a valid 0-23 hour, but satisfy the type checker
  if (!matched) {
    throw new Error(`No organ clock entry found for hour ${hour}`);
  }

  const context: OrganClockContext = {
    activeOrgan: matched.organ,
    pairedOrgan: matched.pair,
    element: matched.element,
    isDigestiveWindow: hour >= 7 && hour < 13,
    isWindDownWindow: hour >= 19 && hour < 23,
  };

  const debug: OrganClockDebug = {
    inputHour: hour,
    inputTimezone: timezone,
    matchedEntry: matchedIndex,
  };

  return { context, debug };
}
