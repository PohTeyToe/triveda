import { describe, expect, it } from 'vitest';
import { ALL_FEATURE_IDS } from '../credits.js';
import {
  CONVERGENCE_DETECTION_CREDIT,
  DOSHA_ANALYSIS_CREDIT,
  ENGINE_CREDITS,
  FIVE_ELEMENT_AFFINITY_CREDIT,
  ORGAN_CLOCK_TIMING_CREDIT,
  PROGRESSIVE_PROFILE_STATE_CREDIT,
  SEASONAL_MAPPING_CREDIT,
  WEATHER_ADJUSTMENT_CREDIT,
} from './engine-credits.js';
import type { EngineCreditSource } from './engine-credits.js';

const EXPECTED_IDS = [
  'seasonal-ritu',
  'organ-clock',
  'weather-adaptation',
  'dosha-analysis',
  'five-element',
  'convergence-detection',
  'progressive-profiling',
] as const;

const VALID_SOURCE_ENGINES = [
  'seasonal',
  'organ-clock',
  'weather',
  'constitutional',
  'convergence',
] as const;

describe('engine credit sources', () => {
  it('exports exactly 7 credit source entries', () => {
    expect(ENGINE_CREDITS).toHaveLength(7);
  });

  it('each entry has all required fields', () => {
    for (const credit of ENGINE_CREDITS) {
      expect(credit).toHaveProperty('id');
      expect(credit).toHaveProperty('label');
      expect(credit).toHaveProperty('description');
      expect(credit).toHaveProperty('sourceEngine');
      expect(credit).toHaveProperty('trigger');
    }
  });

  it('contains the 7 expected IDs', () => {
    const ids = ENGINE_CREDITS.map((c) => c.id);
    for (const expected of EXPECTED_IDS) {
      expect(ids).toContain(expected);
    }
  });

  it('has no duplicate IDs', () => {
    const ids = ENGINE_CREDITS.map((c) => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('all sourceEngine values are valid engine directory names', () => {
    for (const credit of ENGINE_CREDITS) {
      expect(VALID_SOURCE_ENGINES).toContain(credit.sourceEngine);
    }
  });

  it('all labels are non-empty strings', () => {
    for (const credit of ENGINE_CREDITS) {
      expect(typeof credit.label).toBe('string');
      expect(credit.label.length).toBeGreaterThan(0);
    }
  });

  it('all descriptions are non-empty strings', () => {
    for (const credit of ENGINE_CREDITS) {
      expect(typeof credit.description).toBe('string');
      expect(credit.description.length).toBeGreaterThan(0);
    }
  });

  it('all IDs exist in ALL_FEATURE_IDS canonical registry', () => {
    const canonicalIds = ALL_FEATURE_IDS.map((f) => f.id);
    for (const credit of ENGINE_CREDITS) {
      expect(canonicalIds).toContain(credit.id);
    }
  });

  it('individual constants match ENGINE_CREDITS array entries', () => {
    const allConstants: EngineCreditSource[] = [
      SEASONAL_MAPPING_CREDIT,
      ORGAN_CLOCK_TIMING_CREDIT,
      WEATHER_ADJUSTMENT_CREDIT,
      DOSHA_ANALYSIS_CREDIT,
      FIVE_ELEMENT_AFFINITY_CREDIT,
      CONVERGENCE_DETECTION_CREDIT,
      PROGRESSIVE_PROFILE_STATE_CREDIT,
    ];
    expect(allConstants).toEqual(ENGINE_CREDITS);
  });
});
