import { describe, expect, it } from 'vitest';
import { fnv1a, mulberry32 } from '../prng.js';

describe('fnv1a', () => {
  it('returns consistent value for "user-abc"', () => {
    const a = fnv1a('user-abc');
    const b = fnv1a('user-abc');
    expect(a).toBe(b);
  });

  it('returns different values for "user-abc" vs "user-xyz"', () => {
    expect(fnv1a('user-abc')).not.toBe(fnv1a('user-xyz'));
  });

  it('handles empty string without error', () => {
    const result = fnv1a('');
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThanOrEqual(0);
  });
});

describe('Mulberry32', () => {
  it('returns values in [0, 1) across 1000 draws', () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('same seed produces identical sequence', () => {
    const a = mulberry32(12345);
    const b = mulberry32(12345);
    for (let i = 0; i < 10; i++) {
      expect(a()).toBe(b());
    }
  });

  it('different seeds produce different sequences', () => {
    const a = mulberry32(12345);
    const b = mulberry32(67890);
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    const allSame = seqA.every((v, i) => v === seqB[i]);
    expect(allSame).toBe(false);
  });
});
