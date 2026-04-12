import { describe, expect, it } from 'vitest';
import {
  createCulturalMatchCredit,
  createDailyCheckInCredit,
  createFaceScanCredit,
} from '../credit-factories.js';
import type { DailyCheckInAnswer, FaceScanReading } from '../types.js';

const mockReading: FaceScanReading = {
  vata_delta: 0.2,
  pitta_delta: -0.1,
  kapha_delta: 0.05,
  wood_hint: 0.5,
  fire_hint: 0.5,
  earth_hint: 0.5,
  metal_hint: 0.5,
  water_hint: 0.5,
  stress_level: 0.3,
  skin_tone: 'warm, balanced',
  confidence: 0.55,
  simulated: true,
  generated_at: '2026-04-12T12:00:00.000Z',
  seed_hour: 474000,
};

describe('createFaceScanCredit', () => {
  it('returns featureId "face-scan"', () => {
    const result = createFaceScanCredit(mockReading, 0.05);
    expect(result.featureId).toBe('face-scan');
  });

  it('with weight > 0.01 includes "influenced" in contribution', () => {
    const result = createFaceScanCredit(mockReading, 0.05);
    expect(result.contribution).toContain('influenced');
    expect(result.active).toBe(true);
  });

  it('with weight <= 0.01 includes "not significant" in contribution', () => {
    const result = createFaceScanCredit(mockReading, 0.005);
    expect(result.contribution).toContain('not significant');
    expect(result.active).toBe(false);
  });

  it('with weight = 0 includes "not significant"', () => {
    const result = createFaceScanCredit(mockReading, 0);
    expect(result.contribution).toContain('not significant');
  });
});

describe('createDailyCheckInCredit', () => {
  it('with null answer shows "No check-in today"', () => {
    const result = createDailyCheckInCredit(null, 0);
    expect(result.contribution).toBe('No check-in today');
    expect(result.active).toBe(false);
  });

  it('with dismissed answer shows "No check-in today"', () => {
    const answer: DailyCheckInAnswer = {
      date: '2026-04-12',
      selections: { energy: 'left' },
      dismissed: true,
      synced: false,
    };
    const result = createDailyCheckInCredit(answer, 0);
    expect(result.contribution).toBe('No check-in today');
  });

  it('with "tired" selection builds summary', () => {
    const answer: DailyCheckInAnswer = {
      date: '2026-04-12',
      selections: { energy: 'left' },
      dismissed: false,
      synced: false,
    };
    const result = createDailyCheckInCredit(answer, 0.05);
    expect(result.contribution).toContain('tired');
  });

  it('with multiple selections joins them', () => {
    const answer: DailyCheckInAnswer = {
      date: '2026-04-12',
      selections: { energy: 'left', temperature: 'right' },
      dismissed: false,
      synced: false,
    };
    const result = createDailyCheckInCredit(answer, 0.05);
    expect(result.contribution).toContain('tired and cold');
  });

  it('with all selections truncates with "and more"', () => {
    const answer: DailyCheckInAnswer = {
      date: '2026-04-12',
      selections: {
        energy: 'left',
        anxiety: 'left',
        digestion: 'left',
        temperature: 'left',
        rest: 'left',
        appetite: 'left',
      },
      dismissed: false,
      synced: false,
    };
    const result = createDailyCheckInCredit(answer, 0.05);
    expect(result.contribution).toContain('and more');
  });
});

describe('createCulturalMatchCredit', () => {
  it('with weight > 0 includes cuisine labels', () => {
    const result = createCulturalMatchCredit(['jamaican'], 0.08);
    expect(result.contribution).toContain('Jamaican');
    expect(result.contribution).toContain('nudged ranking');
    expect(result.active).toBe(true);
  });

  it('with weight 0 shows "no matching foods"', () => {
    const result = createCulturalMatchCredit([], 0);
    expect(result.contribution).toContain('no matching foods');
    expect(result.active).toBe(false);
  });

  it('with multiple cuisines joins labels', () => {
    const result = createCulturalMatchCredit(['jamaican', 'indian-north'], 0.1);
    expect(result.contribution).toContain('Jamaican, North Indian');
  });

  it('all three factories return objects with featureId, featureName, active, contribution', () => {
    const fs = createFaceScanCredit(mockReading, 0.05);
    expect(fs).toHaveProperty('featureId');
    expect(fs).toHaveProperty('featureName');
    expect(fs).toHaveProperty('active');
    expect(fs).toHaveProperty('contribution');

    const ci = createDailyCheckInCredit(null, 0);
    expect(ci).toHaveProperty('featureId');
    expect(ci).toHaveProperty('featureName');
    expect(ci).toHaveProperty('active');
    expect(ci).toHaveProperty('contribution');

    const cm = createCulturalMatchCredit([], 0);
    expect(cm).toHaveProperty('featureId');
    expect(cm).toHaveProperty('featureName');
    expect(cm).toHaveProperty('active');
    expect(cm).toHaveProperty('contribution');
  });
});
