/**
 * Face scan mock generator.
 *
 * Produces deterministic pseudo-random face scan readings.
 * Same user + same UTC hour = same reading (prevents slot-machine re-scans).
 *
 * Pure TypeScript, no side effects, no network calls, no DOM.
 */

import type { FaceScanReading } from '../inputs/types.js';
import { FaceScanReadingSchema } from '../inputs/types.js';
import { betaish, normalish, uniform } from './distributions.js';
import { fnv1a, mulberry32 } from './prng.js';
import { SKIN_TONE_DESCRIPTORS } from './skin-tones.js';

/**
 * Generate a deterministic face scan reading for a given user.
 *
 * The hour boundary is UTC, not local time. This is intentional -- UTC is
 * absolute and produces the same seed regardless of the user's timezone.
 * Do NOT change to local time.
 *
 * @param userId - Unique user identifier (UUID or alphanumeric)
 * @param timestamp - Optional timestamp in milliseconds (defaults to Date.now())
 * @returns Validated FaceScanReading with simulated: true
 */
export function generateFaceScanReading(userId: string, timestamp?: number): FaceScanReading {
  const hourTs = Math.floor((timestamp ?? Date.now()) / 3_600_000);
  const seed = fnv1a(userId) ^ hourTs;
  const rng = mulberry32(seed);

  const reading = {
    vata_delta: normalish(rng, 0, 0.3),
    pitta_delta: normalish(rng, 0, 0.3),
    kapha_delta: normalish(rng, 0, 0.3),
    wood_hint: betaish(rng, 0, 1, 0.4),
    fire_hint: betaish(rng, 0, 1, 0.4),
    earth_hint: betaish(rng, 0, 1, 0.4),
    metal_hint: betaish(rng, 0, 1, 0.4),
    water_hint: betaish(rng, 0, 1, 0.4),
    stress_level: betaish(rng, 0, 1, 0.35),
    skin_tone:
      SKIN_TONE_DESCRIPTORS[Math.floor(rng() * SKIN_TONE_DESCRIPTORS.length)] ?? 'warm, balanced',
    confidence: uniform(rng, 0.4, 0.7),
    simulated: true as const,
    generated_at: new Date().toISOString(),
    seed_hour: hourTs,
  };

  // Validate constraints before returning
  return FaceScanReadingSchema.parse(reading);
}

// Re-exports for consumers
export { getFaceScanAdjustment } from './scoring.js';
export { fnv1a, mulberry32 } from './prng.js';
export { SKIN_TONE_DESCRIPTORS } from './skin-tones.js';
