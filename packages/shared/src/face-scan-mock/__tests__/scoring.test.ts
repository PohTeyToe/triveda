import { describe, expect, it } from 'vitest';
import type { FaceScanReading } from '../../inputs/types.js';
import { getFaceScanAdjustment } from '../scoring.js';

const mockReading: FaceScanReading = {
  vata_delta: 0.5,
  pitta_delta: -0.3,
  kapha_delta: 0.1,
  wood_hint: 0.4,
  fire_hint: 0.5,
  earth_hint: 0.3,
  metal_hint: 0.6,
  water_hint: 0.2,
  stress_level: 0.4,
  skin_tone: 'warm, balanced',
  confidence: 0.55,
  simulated: true,
  generated_at: '2026-04-12T12:00:00.000Z',
  seed_hour: 474000,
};

describe('getFaceScanAdjustment', () => {
  it('returns null when reading is null', () => {
    expect(getFaceScanAdjustment(null)).toBeNull();
  });

  it('returns deltas multiplied by maxWeight', () => {
    const result = getFaceScanAdjustment(mockReading, 0.15);
    expect(result).not.toBeNull();
    expect(result?.vata).toBeCloseTo(0.5 * 0.15);
  });

  it('default maxWeight is 0.15', () => {
    const result = getFaceScanAdjustment(mockReading);
    expect(result).not.toBeNull();
    expect(result?.vata).toBeCloseTo(0.5 * 0.15);
    expect(result?.pitta).toBeCloseTo(-0.3 * 0.15);
    expect(result?.kapha).toBeCloseTo(0.1 * 0.15);
  });

  it('scales all three dosha deltas', () => {
    const result = getFaceScanAdjustment(mockReading, 0.2);
    expect(result).not.toBeNull();
    expect(result?.vata).toBeCloseTo(0.5 * 0.2);
    expect(result?.pitta).toBeCloseTo(-0.3 * 0.2);
    expect(result?.kapha).toBeCloseTo(0.1 * 0.2);
  });
});
