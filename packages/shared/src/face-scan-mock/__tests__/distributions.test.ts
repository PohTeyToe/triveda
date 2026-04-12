import { describe, expect, it } from 'vitest';
import { betaish, normalish, uniform } from '../distributions.js';
import { mulberry32 } from '../prng.js';

describe('normalish', () => {
  it('returns values within [-1, 1] for 1000 draws', () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 1000; i++) {
      const v = normalish(rng, 0, 0.3);
      expect(v).toBeGreaterThanOrEqual(-1);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('mean=0, stddev=0.3 clusters near 0', () => {
    const rng = mulberry32(42);
    let nearZero = 0;
    const total = 1000;
    for (let i = 0; i < total; i++) {
      const v = normalish(rng, 0, 0.3);
      if (v >= -0.3 && v <= 0.3) nearZero++;
    }
    expect(nearZero / total).toBeGreaterThan(0.7);
  });
});

describe('betaish', () => {
  it('returns values within [low, high] for 1000 draws', () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 1000; i++) {
      const v = betaish(rng, 0, 1, 0.4);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('center=0.4 has mean near 0.4 over 1000 draws', () => {
    const rng = mulberry32(42);
    let sum = 0;
    const total = 1000;
    for (let i = 0; i < total; i++) {
      sum += betaish(rng, 0, 1, 0.4);
    }
    const mean = sum / total;
    expect(mean).toBeGreaterThan(0.3);
    expect(mean).toBeLessThan(0.5);
  });
});

describe('uniform', () => {
  it('returns values within [low, high] for 1000 draws', () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 1000; i++) {
      const v = uniform(rng, 0.4, 0.7);
      expect(v).toBeGreaterThanOrEqual(0.4);
      expect(v).toBeLessThanOrEqual(0.7);
    }
  });
});
