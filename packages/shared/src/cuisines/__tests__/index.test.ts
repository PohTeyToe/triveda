import { describe, expect, it } from 'vitest';
import {
  CUISINES,
  getCuisineByCode,
  getCuisineLabel,
  getCuisinesByRegion,
  isValidCuisineCode,
} from '../index.js';

describe('CUISINES', () => {
  it('has at least 20 entries', () => {
    expect(CUISINES.length).toBeGreaterThanOrEqual(20);
  });

  it('each entry has code, label, and region', () => {
    for (const entry of CUISINES) {
      expect(entry.code.length).toBeGreaterThan(0);
      expect(entry.label.length).toBeGreaterThan(0);
      expect(entry.region.length).toBeGreaterThan(0);
    }
  });

  it('all codes are unique', () => {
    const codes = new Set(CUISINES.map((c) => c.code));
    expect(codes.size).toBe(CUISINES.length);
  });

  it('all codes are lowercase kebab-case', () => {
    for (const entry of CUISINES) {
      expect(entry.code).toMatch(/^[a-z]+(-[a-z]+)*$/);
    }
  });
});

describe('getCuisineByCode', () => {
  it('returns entry for "jamaican"', () => {
    const result = getCuisineByCode('jamaican');
    expect(result).toBeDefined();
    expect(result?.label).toBe('Jamaican');
  });

  it('returns undefined for "martian"', () => {
    expect(getCuisineByCode('martian')).toBeUndefined();
  });
});

describe('getCuisineLabel', () => {
  it('returns "Jamaican" for "jamaican"', () => {
    expect(getCuisineLabel('jamaican')).toBe('Jamaican');
  });

  it('returns "martian" (fallback) for unknown code', () => {
    expect(getCuisineLabel('martian')).toBe('martian');
  });
});

describe('isValidCuisineCode', () => {
  it('returns true for "indian-north"', () => {
    expect(isValidCuisineCode('indian-north')).toBe(true);
  });

  it('returns false for "unknown-cuisine"', () => {
    expect(isValidCuisineCode('unknown-cuisine')).toBe(false);
  });
});

describe('getCuisinesByRegion', () => {
  it('returns South Asian cuisines', () => {
    const result = getCuisinesByRegion('South Asia');
    const codes = result.map((c) => c.code);
    expect(codes).toContain('indian-north');
    expect(codes).toContain('indian-south');
  });
});
