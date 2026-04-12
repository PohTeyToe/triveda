import { Temporal } from 'temporal-polyfill';
import { describe, expect, it } from 'vitest';
import { getNextRitu, getPreviousRitu, getSeasonalContext } from '../seasonal.js';

// ---------------------------------------------------------------------------
// Helper: create a PlainDate from ISO string
// ---------------------------------------------------------------------------
function date(iso: string): Temporal.PlainDate {
  return Temporal.PlainDate.from(iso);
}

// Toronto latitude for Northern Hemisphere tests
const LAT_TORONTO = 43.65;
// Sydney latitude for Southern Hemisphere tests
const LAT_SYDNEY = -33.8;

// ---------------------------------------------------------------------------
// Ritu ranges (Northern Hemisphere)
// ---------------------------------------------------------------------------

describe('Ritu lookup -- Northern Hemisphere', () => {
  it('January 20 returns shishira', () => {
    const result = getSeasonalContext(date('2025-01-20'), LAT_TORONTO);
    expect(result.context.ayurvedaRitu).toBe('shishira');
  });

  it('April 15 returns vasanta', () => {
    const result = getSeasonalContext(date('2025-04-15'), LAT_TORONTO);
    expect(result.context.ayurvedaRitu).toBe('vasanta');
  });

  it('June 15 returns grishma', () => {
    const result = getSeasonalContext(date('2025-06-15'), LAT_TORONTO);
    expect(result.context.ayurvedaRitu).toBe('grishma');
  });

  it('August 1 returns varsha', () => {
    const result = getSeasonalContext(date('2025-08-01'), LAT_TORONTO);
    expect(result.context.ayurvedaRitu).toBe('varsha');
  });

  it('October 15 returns sharad', () => {
    const result = getSeasonalContext(date('2025-10-15'), LAT_TORONTO);
    expect(result.context.ayurvedaRitu).toBe('sharad');
  });

  it('December 1 returns hemanta', () => {
    const result = getSeasonalContext(date('2025-12-01'), LAT_TORONTO);
    expect(result.context.ayurvedaRitu).toBe('hemanta');
  });
});

// ---------------------------------------------------------------------------
// TCM phase lookup
// ---------------------------------------------------------------------------

describe('TCM phase lookup', () => {
  it('March 15 returns wood', () => {
    const result = getSeasonalContext(date('2025-03-15'), LAT_TORONTO);
    expect(result.context.tcmPhase).toBe('wood');
  });

  it('June 15 returns fire', () => {
    const result = getSeasonalContext(date('2025-06-15'), LAT_TORONTO);
    expect(result.context.tcmPhase).toBe('fire');
  });

  it('August 1 returns earth', () => {
    const result = getSeasonalContext(date('2025-08-01'), LAT_TORONTO);
    // Aug 1 = day 213. Earth is 201-230.
    expect(result.context.tcmPhase).toBe('earth');
  });

  it('October 1 returns metal', () => {
    const result = getSeasonalContext(date('2025-10-01'), LAT_TORONTO);
    expect(result.context.tcmPhase).toBe('metal');
  });

  it('December 15 returns water', () => {
    const result = getSeasonalContext(date('2025-12-15'), LAT_TORONTO);
    expect(result.context.tcmPhase).toBe('water');
  });
});

// ---------------------------------------------------------------------------
// Hemisphere inversion (Southern Hemisphere)
// ---------------------------------------------------------------------------

describe('Hemisphere inversion -- Southern Hemisphere', () => {
  it('July 15 at lat -33.8 returns winter Ritu (hemanta)', () => {
    // July 15 = day 196. Adjusted = ((196 + 182 - 1) % 365) + 1 = 13.
    // Day 13 is in hemanta (319-13, wraps).
    const result = getSeasonalContext(date('2025-07-15'), LAT_SYDNEY);
    expect(['hemanta', 'shishira']).toContain(result.context.ayurvedaRitu);
  });

  it('January 15 at lat -33.8 returns summer Ritu', () => {
    // Jan 15 = day 15. Adjusted = ((15 + 182 - 1) % 365) + 1 = 197.
    // Day 197 is in varsha (196-257).
    const result = getSeasonalContext(date('2025-01-15'), LAT_SYDNEY);
    expect(['grishma', 'varsha']).toContain(result.context.ayurvedaRitu);
  });

  it('July 15 at lat -33.8 returns water TCM phase (winter)', () => {
    const result = getSeasonalContext(date('2025-07-15'), LAT_SYDNEY);
    expect(result.context.tcmPhase).toBe('water');
  });
});

// ---------------------------------------------------------------------------
// Sandhi kala (14-day transition window)
// ---------------------------------------------------------------------------

describe('Sandhi kala transitions', () => {
  it('March 14 (last day of Shishira) returns isTransition: true', () => {
    // Day 73. Shishira 14-73. distNext to day 74 = 1. 1 <= 7.
    const result = getSeasonalContext(date('2025-03-14'), LAT_TORONTO);
    expect(result.context.isTransition).toBe(true);
  });

  it('March 15 (first day of Vasanta) returns isTransition: true', () => {
    // Day 74. Vasanta 74-134. distPrev = 0. 0 < 7.
    const result = getSeasonalContext(date('2025-03-15'), LAT_TORONTO);
    expect(result.context.isTransition).toBe(true);
  });

  it('March 11 (4 days before boundary) returns transitionProgress near 0.21', () => {
    // Day 70. Shishira 14-73. distNext = 4. progress = (7-4)/14 = 3/14 ~ 0.214
    const result = getSeasonalContext(date('2025-03-11'), LAT_TORONTO);
    expect(result.context.isTransition).toBe(true);
    expect(result.context.transitionProgress).toBeCloseTo(0.214, 2);
  });

  it('March 21 (7 days into Vasanta) returns transitionProgress near 0.93', () => {
    // Day 80. Vasanta 74-134. distPrev = 6. progress = (7+6)/14 = 13/14 ~ 0.929
    const result = getSeasonalContext(date('2025-03-21'), LAT_TORONTO);
    expect(result.context.isTransition).toBe(true);
    expect(result.context.transitionProgress).toBeCloseTo(0.929, 2);
  });

  it('March 22 (8 days into Vasanta) returns isTransition: false', () => {
    // Day 81. Vasanta 74-134. distPrev = 7. 7 < 7 is false.
    const result = getSeasonalContext(date('2025-03-22'), LAT_TORONTO);
    expect(result.context.isTransition).toBe(false);
  });

  it('adjacentRitu is vasanta during late Shishira transition', () => {
    const result = getSeasonalContext(date('2025-03-14'), LAT_TORONTO);
    expect(result.context.ayurvedaRitu).toBe('shishira');
    expect(result.context.adjacentRitu).toBe('vasanta');
  });

  it('adjacentRitu is shishira during early Vasanta transition', () => {
    const result = getSeasonalContext(date('2025-03-15'), LAT_TORONTO);
    expect(result.context.ayurvedaRitu).toBe('vasanta');
    expect(result.context.adjacentRitu).toBe('shishira');
  });

  it('transition midpoint (boundary day) returns transitionProgress 0.5', () => {
    // Day 74 = first day of Vasanta. distPrev = 0. progress = (7+0)/14 = 0.5
    const result = getSeasonalContext(date('2025-03-15'), LAT_TORONTO);
    expect(result.context.transitionProgress).toBeCloseTo(0.5, 2);
  });

  it('non-transition period has transitionProgress 0 and no adjacentRitu', () => {
    // April 15 = day 105. Vasanta 74-134. distPrev = 31. distNext = 30.
    // Neither <= 7, so no transition.
    const result = getSeasonalContext(date('2025-04-15'), LAT_TORONTO);
    expect(result.context.isTransition).toBe(false);
    expect(result.context.transitionProgress).toBe(0);
    expect(result.context.adjacentRitu).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Latitude dampening
// ---------------------------------------------------------------------------

describe('Latitude dampening', () => {
  const testDate = date('2025-06-15');

  it('latitude 0 returns seasonalIntensity 0.3', () => {
    const result = getSeasonalContext(testDate, 0);
    expect(result.context.seasonalIntensity).toBe(0.3);
  });

  it('latitude 15 returns approximately 0.33', () => {
    const result = getSeasonalContext(testDate, 15);
    expect(result.context.seasonalIntensity).toBeCloseTo(0.333, 2);
  });

  it('latitude 30 returns approximately 0.67', () => {
    const result = getSeasonalContext(testDate, 30);
    expect(result.context.seasonalIntensity).toBeCloseTo(0.667, 2);
  });

  it('latitude 45 returns seasonalIntensity 1.0', () => {
    const result = getSeasonalContext(testDate, 45);
    expect(result.context.seasonalIntensity).toBe(1.0);
  });

  it('latitude 60 returns seasonalIntensity 1.0 (clamped above 45)', () => {
    const result = getSeasonalContext(testDate, 60);
    expect(result.context.seasonalIntensity).toBe(1.0);
  });

  it('latitude -45 returns seasonalIntensity 1.0 (absolute value used)', () => {
    const result = getSeasonalContext(testDate, -45);
    expect(result.context.seasonalIntensity).toBe(1.0);
  });
});

// ---------------------------------------------------------------------------
// Year-boundary wraparound
// ---------------------------------------------------------------------------

describe('Year-boundary wraparound', () => {
  it('January 5 returns hemanta (wraps day 319 to day 13)', () => {
    // Day 5 <= 13, so in hemanta range.
    const result = getSeasonalContext(date('2025-01-05'), LAT_TORONTO);
    expect(result.context.ayurvedaRitu).toBe('hemanta');
  });

  it('January 1 returns water TCM phase (wraps day 312 to day 34)', () => {
    // Day 1 <= 34, so in water range.
    const result = getSeasonalContext(date('2025-01-01'), LAT_TORONTO);
    expect(result.context.tcmPhase).toBe('water');
  });
});

// ---------------------------------------------------------------------------
// Debug output
// ---------------------------------------------------------------------------

describe('Debug output', () => {
  it('includes all required debug fields', () => {
    const result = getSeasonalContext(date('2025-06-15'), LAT_TORONTO);
    expect(result.debug).toEqual(
      expect.objectContaining({
        adjustedDayOfYear: expect.any(Number),
        rawDayOfYear: expect.any(Number),
        hemisphereOffset: expect.any(Number),
        distToNextBoundary: expect.any(Number),
        distFromPrevBoundary: expect.any(Number),
        latitudeDampeningInput: expect.any(Number),
      }),
    );
  });

  it('hemisphereOffset is 0 for Northern Hemisphere', () => {
    const result = getSeasonalContext(date('2025-06-15'), LAT_TORONTO);
    expect(result.debug.hemisphereOffset).toBe(0);
  });

  it('hemisphereOffset is 182 for Southern Hemisphere', () => {
    const result = getSeasonalContext(date('2025-06-15'), LAT_SYDNEY);
    expect(result.debug.hemisphereOffset).toBe(182);
  });

  it('rawDayOfYear matches the input date', () => {
    const result = getSeasonalContext(date('2025-06-15'), LAT_TORONTO);
    // June 15 = day 166
    expect(result.debug.rawDayOfYear).toBe(166);
  });

  it('adjustedDayOfYear reflects hemisphere offset', () => {
    const result = getSeasonalContext(date('2025-01-15'), LAT_SYDNEY);
    // Jan 15 = day 15. adjusted = ((15 + 182 - 1) % 365) + 1 = 197
    expect(result.debug.adjustedDayOfYear).toBe(197);
  });
});

// ---------------------------------------------------------------------------
// Ritu cycle helpers
// ---------------------------------------------------------------------------

describe('getNextRitu / getPreviousRitu', () => {
  it('cycles through all 6 Ritus forward', () => {
    expect(getNextRitu('shishira')).toBe('vasanta');
    expect(getNextRitu('vasanta')).toBe('grishma');
    expect(getNextRitu('grishma')).toBe('varsha');
    expect(getNextRitu('varsha')).toBe('sharad');
    expect(getNextRitu('sharad')).toBe('hemanta');
    expect(getNextRitu('hemanta')).toBe('shishira');
  });

  it('cycles through all 6 Ritus backward', () => {
    expect(getPreviousRitu('shishira')).toBe('hemanta');
    expect(getPreviousRitu('vasanta')).toBe('shishira');
    expect(getPreviousRitu('grishma')).toBe('vasanta');
    expect(getPreviousRitu('varsha')).toBe('grishma');
    expect(getPreviousRitu('sharad')).toBe('varsha');
    expect(getPreviousRitu('hemanta')).toBe('sharad');
  });
});
