import { describe, expect, it } from 'vitest';
import { FaceScanReadingSchema } from '../../inputs/types.js';
import { generateFaceScanReading } from '../index.js';
import { SKIN_TONE_DESCRIPTORS } from '../skin-tones.js';

describe('generateFaceScanReading', () => {
  it('returns identical values on repeated calls with same args', () => {
    const ts = 1712800000000;
    const a = generateFaceScanReading('user-abc', ts);
    const b = generateFaceScanReading('user-abc', ts);
    // generated_at will differ slightly -- compare everything else
    expect(a.vata_delta).toBe(b.vata_delta);
    expect(a.pitta_delta).toBe(b.pitta_delta);
    expect(a.kapha_delta).toBe(b.kapha_delta);
    expect(a.skin_tone).toBe(b.skin_tone);
    expect(a.confidence).toBe(b.confidence);
    expect(a.seed_hour).toBe(b.seed_hour);
  });

  it('returns different values when hour timestamp changes', () => {
    const a = generateFaceScanReading('user-abc', 1712800000000);
    const b = generateFaceScanReading('user-abc', 1712803600000); // +1 hour
    // At least one dosha delta should differ
    const same =
      a.vata_delta === b.vata_delta &&
      a.pitta_delta === b.pitta_delta &&
      a.kapha_delta === b.kapha_delta;
    expect(same).toBe(false);
  });

  it('returns different values for different userIds', () => {
    const ts = 1712800000000;
    const a = generateFaceScanReading('user-abc', ts);
    const b = generateFaceScanReading('user-xyz', ts);
    const same =
      a.vata_delta === b.vata_delta &&
      a.pitta_delta === b.pitta_delta &&
      a.kapha_delta === b.kapha_delta;
    expect(same).toBe(false);
  });

  it('output passes FaceScanReading schema validation', () => {
    const reading = generateFaceScanReading('user-abc', 1712800000000);
    const result = FaceScanReadingSchema.safeParse(reading);
    expect(result.success).toBe(true);
  });

  it('dosha deltas are within [-1, 1]', () => {
    const reading = generateFaceScanReading('user-abc', 1712800000000);
    expect(reading.vata_delta).toBeGreaterThanOrEqual(-1);
    expect(reading.vata_delta).toBeLessThanOrEqual(1);
    expect(reading.pitta_delta).toBeGreaterThanOrEqual(-1);
    expect(reading.pitta_delta).toBeLessThanOrEqual(1);
    expect(reading.kapha_delta).toBeGreaterThanOrEqual(-1);
    expect(reading.kapha_delta).toBeLessThanOrEqual(1);
  });

  it('confidence is within [0.4, 0.7]', () => {
    const reading = generateFaceScanReading('user-abc', 1712800000000);
    expect(reading.confidence).toBeGreaterThanOrEqual(0.4);
    expect(reading.confidence).toBeLessThanOrEqual(0.7);
  });

  it('simulated is always true', () => {
    const reading = generateFaceScanReading('user-abc', 1712800000000);
    expect(reading.simulated).toBe(true);
  });

  it('skin_tone is a non-empty string from the vocabulary', () => {
    const reading = generateFaceScanReading('user-abc', 1712800000000);
    expect(reading.skin_tone.length).toBeGreaterThan(0);
    expect(SKIN_TONE_DESCRIPTORS).toContain(reading.skin_tone);
  });

  it('seed_hour matches the hour-rounded timestamp', () => {
    const ts = 1712800000000;
    const reading = generateFaceScanReading('user-abc', ts);
    expect(reading.seed_hour).toBe(Math.floor(ts / 3_600_000));
  });
});
