import { Temporal } from 'temporal-polyfill';
import { describe, expect, it } from 'vitest';
import { getOrganClock } from '../organ-clock.js';

// ---------------------------------------------------------------------------
// Helper: create a ZonedDateTime at a specific wall-clock hour
// ---------------------------------------------------------------------------

function atHour(hour: number, minute = 0, tz = 'UTC'): Temporal.ZonedDateTime {
  const h = String(hour).padStart(2, '0');
  const m = String(minute).padStart(2, '0');
  return Temporal.ZonedDateTime.from(`2026-04-11T${h}:${m}:00[${tz}]`);
}

// ---------------------------------------------------------------------------
// Each organ hour
// ---------------------------------------------------------------------------

describe('getOrganClock -- each organ hour', () => {
  it('3:30 AM returns lung / metal', () => {
    const result = getOrganClock(atHour(3, 30));
    expect(result.context.activeOrgan).toBe('lung');
    expect(result.context.element).toBe('metal');
  });

  it('5:30 AM returns large_intestine / metal', () => {
    const result = getOrganClock(atHour(5, 30));
    expect(result.context.activeOrgan).toBe('large_intestine');
    expect(result.context.element).toBe('metal');
  });

  it('8:00 AM returns stomach / earth', () => {
    const result = getOrganClock(atHour(8));
    expect(result.context.activeOrgan).toBe('stomach');
    expect(result.context.element).toBe('earth');
  });

  it('10:00 AM returns spleen / earth', () => {
    const result = getOrganClock(atHour(10));
    expect(result.context.activeOrgan).toBe('spleen');
    expect(result.context.element).toBe('earth');
  });

  it('12:00 PM returns heart / fire', () => {
    const result = getOrganClock(atHour(12));
    expect(result.context.activeOrgan).toBe('heart');
    expect(result.context.element).toBe('fire');
  });

  it('14:00 returns small_intestine / fire', () => {
    const result = getOrganClock(atHour(14));
    expect(result.context.activeOrgan).toBe('small_intestine');
    expect(result.context.element).toBe('fire');
  });

  it('16:00 returns bladder / water', () => {
    const result = getOrganClock(atHour(16));
    expect(result.context.activeOrgan).toBe('bladder');
    expect(result.context.element).toBe('water');
  });

  it('18:00 returns kidney / water', () => {
    const result = getOrganClock(atHour(18));
    expect(result.context.activeOrgan).toBe('kidney');
    expect(result.context.element).toBe('water');
  });

  it('20:00 returns pericardium / fire', () => {
    const result = getOrganClock(atHour(20));
    expect(result.context.activeOrgan).toBe('pericardium');
    expect(result.context.element).toBe('fire');
  });

  it('22:00 returns triple_burner / fire', () => {
    const result = getOrganClock(atHour(22));
    expect(result.context.activeOrgan).toBe('triple_burner');
    expect(result.context.element).toBe('fire');
  });

  it('23:30 returns gallbladder / wood (midnight crossing)', () => {
    const result = getOrganClock(atHour(23, 30));
    expect(result.context.activeOrgan).toBe('gallbladder');
    expect(result.context.element).toBe('wood');
  });

  it('0:30 AM returns gallbladder (post-midnight, still < 1)', () => {
    const result = getOrganClock(atHour(0, 30));
    expect(result.context.activeOrgan).toBe('gallbladder');
  });

  it('1:00 AM returns liver / wood', () => {
    const result = getOrganClock(atHour(1));
    expect(result.context.activeOrgan).toBe('liver');
    expect(result.context.element).toBe('wood');
  });

  it('2:30 AM returns liver', () => {
    const result = getOrganClock(atHour(2, 30));
    expect(result.context.activeOrgan).toBe('liver');
  });
});

// ---------------------------------------------------------------------------
// Yin-yang pairs
// ---------------------------------------------------------------------------

describe('getOrganClock -- yin-yang pairs', () => {
  it('during stomach hour, pairedOrgan is spleen', () => {
    const result = getOrganClock(atHour(8));
    expect(result.context.pairedOrgan).toBe('spleen');
  });

  it('during heart hour, pairedOrgan is small_intestine', () => {
    const result = getOrganClock(atHour(12));
    expect(result.context.pairedOrgan).toBe('small_intestine');
  });

  it('during gallbladder hour, pairedOrgan is liver', () => {
    const result = getOrganClock(atHour(23, 30));
    expect(result.context.pairedOrgan).toBe('liver');
  });
});

// ---------------------------------------------------------------------------
// Digestive window (7 <= hour < 13)
// ---------------------------------------------------------------------------

describe('getOrganClock -- digestive window', () => {
  it('7:00 AM returns isDigestiveWindow true', () => {
    const result = getOrganClock(atHour(7));
    expect(result.context.isDigestiveWindow).toBe(true);
  });

  it('12:00 PM returns isDigestiveWindow true', () => {
    const result = getOrganClock(atHour(12));
    expect(result.context.isDigestiveWindow).toBe(true);
  });

  it('1:00 PM (13:00) returns isDigestiveWindow false', () => {
    const result = getOrganClock(atHour(13));
    expect(result.context.isDigestiveWindow).toBe(false);
  });

  it('6:00 AM returns isDigestiveWindow false', () => {
    const result = getOrganClock(atHour(6));
    expect(result.context.isDigestiveWindow).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Wind-down window (19 <= hour < 23)
// ---------------------------------------------------------------------------

describe('getOrganClock -- wind-down window', () => {
  it('7:00 PM (19:00) returns isWindDownWindow true', () => {
    const result = getOrganClock(atHour(19));
    expect(result.context.isWindDownWindow).toBe(true);
  });

  it('10:00 PM (22:00) returns isWindDownWindow true', () => {
    const result = getOrganClock(atHour(22));
    expect(result.context.isWindDownWindow).toBe(true);
  });

  it('11:00 PM (23:00) returns isWindDownWindow false', () => {
    const result = getOrganClock(atHour(23));
    expect(result.context.isWindDownWindow).toBe(false);
  });

  it('6:00 PM (18:00) returns isWindDownWindow false', () => {
    const result = getOrganClock(atHour(18));
    expect(result.context.isWindDownWindow).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Timezone awareness
// ---------------------------------------------------------------------------

describe('getOrganClock -- timezone awareness', () => {
  // 2026-04-11T12:00Z:
  //   America/Toronto = EDT (UTC-4) => 08:00 => stomach
  //   Asia/Tokyo      = JST (UTC+9) => 21:00 => triple_burner
  //   Europe/London   = BST (UTC+1) => 13:00 => small_intestine

  it('UTC noon in America/Toronto (8 AM EDT) returns stomach', () => {
    const instant = Temporal.Instant.from('2026-04-11T12:00:00Z');
    const zdt = instant.toZonedDateTimeISO('America/Toronto');
    const result = getOrganClock(zdt);
    expect(result.context.activeOrgan).toBe('stomach');
  });

  it('UTC noon in Asia/Tokyo (9 PM JST) returns triple_burner', () => {
    const instant = Temporal.Instant.from('2026-04-11T12:00:00Z');
    const zdt = instant.toZonedDateTimeISO('Asia/Tokyo');
    const result = getOrganClock(zdt);
    expect(result.context.activeOrgan).toBe('triple_burner');
  });

  it('UTC noon in Europe/London (1 PM BST) returns small_intestine', () => {
    const instant = Temporal.Instant.from('2026-04-11T12:00:00Z');
    const zdt = instant.toZonedDateTimeISO('Europe/London');
    const result = getOrganClock(zdt);
    expect(result.context.activeOrgan).toBe('small_intestine');
  });
});

// ---------------------------------------------------------------------------
// Hour boundary behavior
// ---------------------------------------------------------------------------

describe('getOrganClock -- hour boundaries', () => {
  it('exactly hour 7 returns stomach (>= 7)', () => {
    const result = getOrganClock(atHour(7));
    expect(result.context.activeOrgan).toBe('stomach');
  });

  it('exactly hour 9 returns spleen (>= 9)', () => {
    const result = getOrganClock(atHour(9));
    expect(result.context.activeOrgan).toBe('spleen');
  });

  it('exactly hour 23 returns gallbladder (>= 23)', () => {
    const result = getOrganClock(atHour(23));
    expect(result.context.activeOrgan).toBe('gallbladder');
  });

  it('exactly hour 0 returns gallbladder (< 1 via OR branch)', () => {
    const result = getOrganClock(atHour(0));
    expect(result.context.activeOrgan).toBe('gallbladder');
  });

  it('exactly hour 1 returns liver (>= 1)', () => {
    const result = getOrganClock(atHour(1));
    expect(result.context.activeOrgan).toBe('liver');
  });
});

// ---------------------------------------------------------------------------
// Debug output
// ---------------------------------------------------------------------------

describe('getOrganClock -- debug output', () => {
  it('includes inputHour, inputTimezone, and matchedEntry', () => {
    const zdt = atHour(8, 0, 'America/Toronto');
    const result = getOrganClock(zdt);
    expect(result.debug.inputHour).toBe(8);
    expect(result.debug.inputTimezone).toBe('America/Toronto');
    expect(typeof result.debug.matchedEntry).toBe('number');
    expect(result.debug.matchedEntry).toBeGreaterThanOrEqual(0);
    expect(result.debug.matchedEntry).toBeLessThan(12);
  });

  it('matchedEntry index 2 corresponds to stomach (7-9)', () => {
    const result = getOrganClock(atHour(8));
    // Table order: lung(0), large_intestine(1), stomach(2), ...
    expect(result.debug.matchedEntry).toBe(2);
    expect(result.context.activeOrgan).toBe('stomach');
  });

  it('matchedEntry index 10 corresponds to gallbladder (23-1)', () => {
    const result = getOrganClock(atHour(23, 30));
    expect(result.debug.matchedEntry).toBe(10);
    expect(result.context.activeOrgan).toBe('gallbladder');
  });
});
