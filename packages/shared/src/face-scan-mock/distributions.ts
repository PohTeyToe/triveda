/**
 * Distribution shaping functions for mock data generation.
 *
 * These produce pseudo-random values shaped to approximate
 * normal and beta distributions using simple uniform draws.
 */

/**
 * Irwin-Hall n=3 approximation of a normal distribution.
 *
 * Averages 3 uniform draws, rescales to approximate the requested
 * mean and standard deviation, then clamps to [-1, 1].
 */
export function normalish(rng: () => number, mean: number, stddev: number): number {
  const a = rng();
  const b = rng();
  const c = rng();
  const avg = (a + b + c) / 3;
  const value = (avg - 0.5) * 2 * stddev * Math.sqrt(3) + mean;
  return Math.max(-1, Math.min(1, value));
}

/**
 * Beta-like distribution approximation.
 *
 * Averages 2 uniform draws, biases toward center, then scales to [low, high].
 */
export function betaish(rng: () => number, low: number, high: number, center: number): number {
  const a = rng();
  const b = rng();
  const avg = (a + b) / 2;
  const biased = avg * 0.6 + ((center - low) / (high - low)) * 0.4;
  const value = biased * (high - low) + low;
  return Math.max(low, Math.min(high, value));
}

/**
 * Single uniform draw scaled to [low, high].
 */
export function uniform(rng: () => number, low: number, high: number): number {
  return rng() * (high - low) + low;
}
