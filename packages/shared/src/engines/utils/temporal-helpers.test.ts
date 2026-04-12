import { Temporal } from 'temporal-polyfill';
import { describe, expect, it } from 'vitest';
import { clamp, fromDate, getDayOfYear, isLeapYear } from './temporal-helpers.js';

describe('fromDate', () => {
  it('converts a JS Date + America/Toronto to Eastern time', () => {
    // 2025-06-15T12:00:00Z = 8:00 AM EDT (UTC-4)
    const date = new Date('2025-06-15T12:00:00Z');
    const zdt = fromDate(date, 'America/Toronto');
    expect(zdt.hour).toBe(8);
    expect(zdt.timeZoneId).toBe('America/Toronto');
  });

  it('converts a JS Date + Asia/Tokyo to JST hour', () => {
    // 2025-06-15T12:00:00Z = 9:00 PM JST (UTC+9)
    const date = new Date('2025-06-15T12:00:00Z');
    const zdt = fromDate(date, 'Asia/Tokyo');
    expect(zdt.hour).toBe(21);
    expect(zdt.timeZoneId).toBe('Asia/Tokyo');
  });
});

describe('getDayOfYear', () => {
  it('returns 1 for January 1', () => {
    const date = Temporal.PlainDate.from('2025-01-01');
    expect(getDayOfYear(date)).toBe(1);
  });

  it('returns 365 for December 31 in non-leap year', () => {
    const date = Temporal.PlainDate.from('2025-12-31');
    expect(getDayOfYear(date)).toBe(365);
  });

  it('returns 366 for December 31 in leap year (2028)', () => {
    const date = Temporal.PlainDate.from('2028-12-31');
    expect(getDayOfYear(date)).toBe(366);
  });
});

describe('isLeapYear', () => {
  it('returns false for 2025', () => {
    expect(isLeapYear(Temporal.PlainDate.from('2025-01-01'))).toBe(false);
  });

  it('returns true for 2028', () => {
    expect(isLeapYear(Temporal.PlainDate.from('2028-01-01'))).toBe(true);
  });
});

describe('clamp', () => {
  it('returns min when value < min', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('returns max when value > max', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('returns min when value equals min', () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it('returns max when value equals max', () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });
});
