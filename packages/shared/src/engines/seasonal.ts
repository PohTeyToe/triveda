/**
 * Seasonal Engine -- deterministic Ritu and TCM phase lookup.
 *
 * Converts a date and latitude into an Ayurvedic Ritu (6 seasons) and
 * TCM phase (5 phases), with hemisphere inversion, latitude dampening,
 * and 14-day sandhi kala transition blending.
 *
 * Pure function: no IO, no side effects.
 */

import type { Temporal } from 'temporal-polyfill';
import type { Ritu, SeasonalResult, TCMPhase } from './types.js';
import { clamp, getDayOfYear } from './utils/index.js';

// ---------------------------------------------------------------------------
// Ritu boundary definitions (Ashtanga Hridayam, Sutra Sthana Ch. 3)
// ---------------------------------------------------------------------------

interface RituRange {
  ritu: Ritu;
  startDay: number;
  endDay: number;
  quality: string;
}

const RITU_RANGES: readonly RituRange[] = [
  { ritu: 'shishira', startDay: 14, endDay: 73, quality: 'cold-dry' },
  { ritu: 'vasanta', startDay: 74, endDay: 134, quality: 'warm-moist' },
  { ritu: 'grishma', startDay: 135, endDay: 195, quality: 'hot-dry' },
  { ritu: 'varsha', startDay: 196, endDay: 257, quality: 'warm-wet' },
  { ritu: 'sharad', startDay: 258, endDay: 318, quality: 'cool-dry' },
  { ritu: 'hemanta', startDay: 319, endDay: 13, quality: 'cold-moist' },
] as const;

// ---------------------------------------------------------------------------
// TCM phase boundary definitions (Jieqi solar calendar system)
// ---------------------------------------------------------------------------

interface TCMRange {
  phase: TCMPhase;
  startDay: number;
  endDay: number;
}

const TCM_RANGES: readonly TCMRange[] = [
  { phase: 'wood', startDay: 35, endDay: 125 },
  { phase: 'fire', startDay: 126, endDay: 200 },
  { phase: 'earth', startDay: 201, endDay: 230 },
  { phase: 'metal', startDay: 231, endDay: 311 },
  { phase: 'water', startDay: 312, endDay: 34 },
] as const;

// ---------------------------------------------------------------------------
// Ritu cycle helpers
// ---------------------------------------------------------------------------

const RITU_ORDER: readonly Ritu[] = [
  'shishira',
  'vasanta',
  'grishma',
  'varsha',
  'sharad',
  'hemanta',
];

export function getNextRitu(ritu: Ritu): Ritu {
  const idx = RITU_ORDER.indexOf(ritu);
  return RITU_ORDER[(idx + 1) % 6] as Ritu;
}

export function getPreviousRitu(ritu: Ritu): Ritu {
  const idx = RITU_ORDER.indexOf(ritu);
  return RITU_ORDER[(idx + 5) % 6] as Ritu;
}

// ---------------------------------------------------------------------------
// Range matching (handles year-boundary wraparound)
// ---------------------------------------------------------------------------

function dayInRange(day: number, start: number, end: number): boolean {
  if (start > end) {
    // Wraps around year boundary (e.g., hemanta 319..13, water 312..34)
    return day >= start || day <= end;
  }
  return day >= start && day <= end;
}

function findRitu(adjustedDay: number): Ritu {
  for (const range of RITU_RANGES) {
    if (dayInRange(adjustedDay, range.startDay, range.endDay)) {
      return range.ritu;
    }
  }
  // Should never happen if ranges cover all 365/366 days
  return 'hemanta';
}

function findTCMPhase(adjustedDay: number): TCMPhase {
  for (const range of TCM_RANGES) {
    if (dayInRange(adjustedDay, range.startDay, range.endDay)) {
      return range.phase;
    }
  }
  return 'water';
}

// ---------------------------------------------------------------------------
// Ritu boundary distance calculations
// ---------------------------------------------------------------------------

function getRituRange(ritu: Ritu): RituRange {
  const found = RITU_RANGES.find((r) => r.ritu === ritu);
  if (!found) {
    throw new Error(`Unknown ritu: ${ritu}`);
  }
  return found;
}

/**
 * Calculate circular distance between two day-of-year values.
 * Always returns a non-negative value in [0, daysInYear/2].
 */
function circularDist(from: number, to: number, daysInYear: number): number {
  const diff = (((to - from) % daysInYear) + daysInYear) % daysInYear;
  return diff;
}

/**
 * Distance from adjustedDay to the end boundary of the current Ritu
 * (i.e., how many days until the next Ritu starts).
 */
function distToNextBoundary(adjustedDay: number, ritu: Ritu, daysInYear: number): number {
  const range = getRituRange(ritu);
  // Next boundary is endDay + 1 (the start of the next Ritu)
  // But we want distance to the end of current Ritu, which is endDay itself.
  // "dist to next boundary" = how many days from adjustedDay to the first day
  // of the next Ritu (endDay + 1), but measured as the end of the current range.
  const nextStart = (range.endDay % daysInYear) + 1;
  return circularDist(adjustedDay, nextStart, daysInYear);
}

/**
 * Distance from the start boundary of the current Ritu to adjustedDay
 * (i.e., how many days since this Ritu started).
 */
function distFromPrevBoundary(adjustedDay: number, ritu: Ritu, daysInYear: number): number {
  const range = getRituRange(ritu);
  return circularDist(range.startDay, adjustedDay, daysInYear);
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

/**
 * Get seasonal context for a date and latitude.
 *
 * @param date - A Temporal.PlainDate
 * @param latitude - Geographic latitude (-90 to 90)
 * @returns SeasonalResult with context and debug info
 */
export function getSeasonalContext(date: Temporal.PlainDate, latitude: number): SeasonalResult {
  const rawDayOfYear = getDayOfYear(date);
  const daysInYear = date.inLeapYear ? 366 : 365;

  // Hemisphere inversion: offset by ~6 months for southern hemisphere
  const hemisphereOffset = latitude < 0 ? 182 : 0;
  const adjustedDayOfYear = ((rawDayOfYear + hemisphereOffset - 1) % daysInYear) + 1;

  // Look up Ritu and TCM phase using the adjusted day
  const ayurvedaRitu = findRitu(adjustedDayOfYear);
  const tcmPhase = findTCMPhase(adjustedDayOfYear);

  // Boundary distances for sandhi kala
  const distNext = distToNextBoundary(adjustedDayOfYear, ayurvedaRitu, daysInYear);
  const distPrev = distFromPrevBoundary(adjustedDayOfYear, ayurvedaRitu, daysInYear);

  // Sandhi kala: 14-day transition window centered on the boundary
  // 7 days before boundary + 7 days after boundary
  let isTransition = false;
  let transitionProgress = 0;
  let adjacentRitu: Ritu | undefined;

  if (distNext <= 7) {
    // Approaching the end of current Ritu (within 7 days of next boundary)
    isTransition = true;
    // At distNext=7: progress = 0/14 = 0.0
    // At distNext=1: progress = 6/14 ~ 0.43
    // At distNext=0 (boundary): progress = 7/14 = 0.5
    transitionProgress = (7 - distNext) / 14;
    adjacentRitu = getNextRitu(ayurvedaRitu);
  } else if (distPrev < 7) {
    // Just entered the current Ritu (within 7 days of previous boundary)
    isTransition = true;
    // At distPrev=0 (first day of new Ritu): progress = 7/14 = 0.5
    // At distPrev=6 (7th day): progress = 13/14 ~ 0.93
    transitionProgress = (7 + distPrev) / 14;
    adjacentRitu = getPreviousRitu(ayurvedaRitu);
  }

  // Latitude dampening: equatorial regions have muted seasonal variation
  const latitudeDampeningInput = Math.abs(latitude);
  const seasonalIntensity = clamp(latitudeDampeningInput / 45, 0.3, 1.0);

  return {
    context: {
      ayurvedaRitu,
      tcmPhase,
      isTransition,
      transitionProgress,
      seasonalIntensity,
      ...(adjacentRitu !== undefined ? { adjacentRitu } : {}),
    },
    debug: {
      adjustedDayOfYear,
      rawDayOfYear,
      hemisphereOffset,
      distToNextBoundary: distNext,
      distFromPrevBoundary: distPrev,
      latitudeDampeningInput,
    },
  };
}
