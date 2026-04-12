import { describe, expect, it } from 'vitest';
import { linearInterpolate, mode, normalize } from './math-helpers.js';

describe('normalize', () => {
  it('produces values summing to 1.0', () => {
    const result = normalize({ a: 3, b: 5, c: 2 });
    const sum = Object.values(result).reduce((s, v) => s + v, 0);
    expect(sum).toBeCloseTo(1.0);
  });

  it('preserves ratios (2:1 becomes 0.667:0.333)', () => {
    const result = normalize({ a: 2, b: 1 });
    expect(result.a).toBeCloseTo(0.667, 2);
    expect(result.b).toBeCloseTo(0.333, 2);
  });

  it('handles all-zero input (returns equal distribution)', () => {
    const result = normalize({ a: 0, b: 0, c: 0 });
    const expected = 1 / 3;
    expect(result.a).toBeCloseTo(expected);
    expect(result.b).toBeCloseTo(expected);
    expect(result.c).toBeCloseTo(expected);
  });

  it('preserves key order', () => {
    const result = normalize({ x: 1, y: 2, z: 3 });
    expect(Object.keys(result)).toEqual(['x', 'y', 'z']);
  });
});

describe('mode', () => {
  it('returns the most frequent string in an array', () => {
    expect(mode(['a', 'b', 'a', 'c', 'a'])).toBe('a');
  });

  it('returns first occurrence on tie', () => {
    // 'b' and 'a' both appear twice, but 'b' appears first
    expect(mode(['b', 'a', 'b', 'a'])).toBe('b');
  });

  it('returns the single element for a one-element array', () => {
    expect(mode(['x'])).toBe('x');
  });

  it('handles all-unique values (first element wins)', () => {
    expect(mode(['c', 'b', 'a'])).toBe('c');
  });
});

describe('linearInterpolate', () => {
  it('maps correctly at low boundary', () => {
    // value=0, from [0,10] to [100,200] -> 100
    expect(linearInterpolate(0, 0, 10, 100, 200)).toBe(100);
  });

  it('maps correctly at high boundary', () => {
    // value=10, from [0,10] to [100,200] -> 200
    expect(linearInterpolate(10, 0, 10, 100, 200)).toBe(200);
  });

  it('maps correctly at midpoint', () => {
    // value=5, from [0,10] to [100,200] -> 150
    expect(linearInterpolate(5, 0, 10, 100, 200)).toBe(150);
  });

  it('extrapolates beyond source range', () => {
    // value=15, from [0,10] to [100,200] -> 250
    expect(linearInterpolate(15, 0, 10, 100, 200)).toBe(250);
  });

  it('handles inverted target range', () => {
    // value=5, from [0,10] to [200,100] -> 150
    expect(linearInterpolate(5, 0, 10, 200, 100)).toBe(150);
  });
});
