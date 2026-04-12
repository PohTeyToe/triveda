import { describe, expect, it } from 'bun:test';
import { ALL_FEATURE_IDS } from '@triveda/shared/src/credits.js';
import { type EndpointType, composeCredits } from '../../src/lib/credit-composer.js';

const ENDPOINT_TYPES: EndpointType[] = ['constitution', 'weekly-herb', 'triggered-recs'];

describe('composeCredits', () => {
  for (const endpointType of ENDPOINT_TYPES) {
    it(`returns exactly ${ALL_FEATURE_IDS.length} entries for ${endpointType}`, () => {
      const credits = composeCredits(endpointType);
      expect(credits).toHaveLength(ALL_FEATURE_IDS.length);
    });

    it(`has no duplicate feature IDs for ${endpointType}`, () => {
      const credits = composeCredits(endpointType);
      const ids = credits.map((c) => c.featureId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it(`all entries have required fields for ${endpointType}`, () => {
      const credits = composeCredits(endpointType);
      for (const credit of credits) {
        expect(typeof credit.featureId).toBe('string');
        expect(credit.featureId.length).toBeGreaterThan(0);
        expect(typeof credit.featureName).toBe('string');
        expect(credit.featureName.length).toBeGreaterThan(0);
        expect(typeof credit.active).toBe('boolean');
        expect(typeof credit.contribution).toBe('string');
        expect(['active', 'latent', 'future']).toContain(credit.contribution);
      }
    });
  }

  it('constitution endpoint: dosha-analysis is active', () => {
    const credits = composeCredits('constitution');
    const dosha = credits.find((c) => c.featureId === 'dosha-analysis');
    expect(dosha?.active).toBe(true);
    expect(dosha?.contribution).toBe('active');
  });

  it('constitution endpoint: weather-adaptation is latent', () => {
    const credits = composeCredits('constitution');
    const weather = credits.find((c) => c.featureId === 'weather-adaptation');
    expect(weather?.active).toBe(false);
    expect(weather?.contribution).toBe('latent');
  });

  it('weekly-herb endpoint: seasonal-ritu is active', () => {
    const credits = composeCredits('weekly-herb');
    const seasonal = credits.find((c) => c.featureId === 'seasonal-ritu');
    expect(seasonal?.active).toBe(true);
    expect(seasonal?.contribution).toBe('active');
  });

  it('triggered-recs endpoint: organ-clock is active', () => {
    const credits = composeCredits('triggered-recs');
    const organClock = credits.find((c) => c.featureId === 'organ-clock');
    expect(organClock?.active).toBe(true);
    expect(organClock?.contribution).toBe('active');
  });

  it('future features always have contribution "future" and active=false', () => {
    const futureIds = [
      'pubmed-citations',
      'face-scan',
      'contradiction-engine',
      'food-feedback-loop',
    ];

    for (const endpointType of ENDPOINT_TYPES) {
      const credits = composeCredits(endpointType);
      for (const futureId of futureIds) {
        const credit = credits.find((c) => c.featureId === futureId);
        expect(credit?.contribution).toBe('future');
        expect(credit?.active).toBe(false);
      }
    }
  });

  it('rejects empty credits array via length check', () => {
    // Verify that composeCredits never returns an empty array
    for (const endpointType of ENDPOINT_TYPES) {
      const credits = composeCredits(endpointType);
      expect(credits.length).toBeGreaterThan(0);
    }
  });
});
