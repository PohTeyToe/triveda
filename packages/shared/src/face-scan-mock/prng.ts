/**
 * Deterministic PRNG utilities for the face scan mock generator.
 *
 * FNV-1a hash for seed derivation, Mulberry32 for pseudo-random float generation.
 * No external dependencies.
 */

/**
 * FNV-1a hash -- produces a 32-bit unsigned integer from a string.
 *
 * Better distribution than DJB2 for short strings (UUIDs, user IDs).
 */
export function fnv1a(str: string): number {
  let hash = 0x811c9dc5; // offset basis: 2166136261
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // FNV prime: 16777619
  }
  return hash >>> 0;
}

/**
 * Mulberry32 PRNG -- returns a closure producing floats in [0, 1).
 *
 * Deterministic: same seed always yields the same sequence.
 */
export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t = (t + Math.imul(t ^ (t >>> 7), t | 61)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
