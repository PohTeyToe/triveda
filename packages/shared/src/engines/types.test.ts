import { describe, expect, it } from 'vitest';
import type {
  Answer,
  ConstitutionalProfile,
  ConstitutionalResult,
  ConvergenceReport,
  ConvergenceResult,
  DayContext,
  DoshaProfile,
  FoodForConvergence,
  OrganClockContext,
  OrganClockResult,
  SeasonalContext,
  SeasonalResult,
  WeatherContext,
  WeatherResult,
} from './types.js';

/**
 * Compile-time type assertion tests.
 *
 * If this file compiles and runs without type errors, the types are
 * correctly defined. Runtime assertions verify assignability.
 */

describe('engine types -- compile-time assertions', () => {
  it('SeasonalContext accepts all required fields', () => {
    const ctx: SeasonalContext = {
      ayurvedaRitu: 'vasanta',
      tcmPhase: 'wood',
      isTransition: false,
      transitionProgress: 0,
      seasonalIntensity: 0.8,
    };
    expect(ctx.ayurvedaRitu).toBe('vasanta');
  });

  it('SeasonalContext accepts optional adjacentRitu', () => {
    const ctx: SeasonalContext = {
      ayurvedaRitu: 'vasanta',
      tcmPhase: 'wood',
      isTransition: true,
      transitionProgress: 0.3,
      seasonalIntensity: 0.6,
      adjacentRitu: 'grishma',
    };
    expect(ctx.adjacentRitu).toBe('grishma');
  });

  it('ConstitutionalProfile accepts nullable fields', () => {
    const profile: ConstitutionalProfile = {
      doshaScores: { vata: 0.5, pitta: 0.3, kapha: 0.2 },
      doshaType: {
        type: 'dual',
        primary: 'vata',
        secondary: 'pitta',
        tertiary: 'kapha',
      },
      elementScores: null,
      primaryElement: null,
      secondaryElement: null,
      metabolicType: null,
      ansDominance: null,
      completeness: 0.5,
      confidence: 0.7,
      summary: 'Partial assessment',
    };
    expect(profile.elementScores).toBeNull();
    expect(profile.metabolicType).toBeNull();
    expect(profile.ansDominance).toBeNull();
  });

  it('ConstitutionalProfile accepts non-null optional fields', () => {
    const profile: ConstitutionalProfile = {
      doshaScores: { vata: 0.4, pitta: 0.4, kapha: 0.2 },
      doshaType: {
        type: 'dual',
        primary: 'vata',
        secondary: 'pitta',
        tertiary: 'kapha',
      },
      elementScores: { wood: 0.3, fire: 0.2, earth: 0.2, metal: 0.2, water: 0.1 },
      primaryElement: 'wood',
      secondaryElement: 'fire',
      metabolicType: 'fast_oxidizer',
      ansDominance: 'sympathetic',
      completeness: 1.0,
      confidence: 0.95,
      summary: 'Full assessment',
    };
    expect(profile.elementScores).not.toBeNull();
  });

  it('OrganClockContext compiles with all organ string literals', () => {
    const ctx: OrganClockContext = {
      activeOrgan: 'Liver',
      pairedOrgan: 'Gallbladder',
      element: 'wood',
      isDigestiveWindow: false,
      isWindDownWindow: false,
    };
    expect(ctx.activeOrgan).toBe('Liver');
  });

  it('WeatherContext compiles with all dosha aggravation fields', () => {
    const ctx: WeatherContext = {
      thermalNeed: 0.5,
      kaphaAggravation: 0.3,
      vataAggravation: 0.2,
      pittaAggravation: 0.1,
      tcmWindPattern: 'wind_cold',
    };
    expect(ctx.kaphaAggravation).toBe(0.3);
    expect(ctx.vataAggravation).toBe(0.2);
    expect(ctx.pittaAggravation).toBe(0.1);
  });

  it('ConvergenceReport compiles with all four dimension results', () => {
    const report: ConvergenceReport = {
      score: 0.85,
      agreementCount: 3,
      interestingDivergence: true,
      dimensions: {
        thermal: { agrees: true, detail: 'Both warming' },
        constitutional: { agrees: true, detail: 'Matches dosha' },
        seasonal: { agrees: false, detail: 'Ritu mismatch' },
        evidence: { agrees: true, detail: 'Strong evidence' },
      },
    };
    expect(report.dimensions.thermal.agrees).toBe(true);
    expect(report.dimensions.seasonal.agrees).toBe(false);
  });

  it('DoshaProfile fields vata, pitta, kapha must be present', () => {
    const dp: DoshaProfile = { vata: 0.33, pitta: 0.34, kapha: 0.33 };
    expect(dp.vata).toBeDefined();
    expect(dp.pitta).toBeDefined();
    expect(dp.kapha).toBeDefined();
  });

  it('DayContext composes SeasonalContext, WeatherContext, OrganClockContext', () => {
    const day: DayContext = {
      seasonal: {
        ayurvedaRitu: 'hemanta',
        tcmPhase: 'water',
        isTransition: false,
        transitionProgress: 0,
        seasonalIntensity: 0.9,
      },
      weather: {
        thermalNeed: 0.7,
        kaphaAggravation: 0.4,
        vataAggravation: 0.6,
        pittaAggravation: 0.1,
        tcmWindPattern: 'wind_cold',
      },
      organClock: {
        activeOrgan: 'Stomach',
        pairedOrgan: 'Spleen',
        element: 'earth',
        isDigestiveWindow: true,
        isWindDownWindow: false,
      },
    };
    expect(day.seasonal.ayurvedaRitu).toBe('hemanta');
    expect(day.weather.tcmWindPattern).toBe('wind_cold');
    expect(day.organClock.isDigestiveWindow).toBe(true);
  });

  it('Answer type accepts questionId 1-18 and choice strings', () => {
    const a1: Answer = { questionId: 1, choice: 'A' };
    const a18: Answer = { questionId: 18, choice: 'Light and thin' };
    expect(a1.questionId).toBe(1);
    expect(a18.questionId).toBe(18);
  });

  it('FoodForConvergence includes ayurveda, tcm, naturopathy sub-objects', () => {
    const food: FoodForConvergence = {
      ayurveda: {
        virya: 'ushna',
        vataEffect: -0.3,
        pittaEffect: 0.2,
        kaphaEffect: -0.1,
        seasonalFit: {
          shishira: 0.8,
          vasanta: 0.5,
          grishma: 0.2,
          varsha: 0.6,
          sharad: 0.4,
          hemanta: 0.9,
        },
      },
      tcm: {
        thermalNature: 'warm',
        elementFit: {
          wood: 0.3,
          fire: 0.5,
          earth: 0.4,
          metal: 0.2,
          water: 0.6,
        },
      },
      naturopathy: {
        evidenceLevel: 'strong',
        metabolicTypeAffinity: {
          fast_oxidizer: 0.7,
          slow_oxidizer: 0.3,
          mixed_oxidizer: 0.5,
        },
      },
    };
    expect(food.ayurveda.virya).toBe('ushna');
    expect(food.tcm.thermalNature).toBe('warm');
    expect(food.naturopathy.evidenceLevel).toBe('strong');
  });

  it('all result wrapper types contain context/profile/report and debug fields', () => {
    // SeasonalResult
    const sr: SeasonalResult = {
      context: {
        ayurvedaRitu: 'grishma',
        tcmPhase: 'fire',
        isTransition: false,
        transitionProgress: 0,
        seasonalIntensity: 1.0,
      },
      debug: {
        adjustedDayOfYear: 172,
        rawDayOfYear: 172,
        hemisphereOffset: 0,
        distToNextBoundary: 20,
        distFromPrevBoundary: 40,
        latitudeDampeningInput: 45,
      },
    };
    expect(sr.context).toBeDefined();
    expect(sr.debug).toBeDefined();

    // ConstitutionalResult
    const cr: ConstitutionalResult = {
      profile: {
        doshaScores: { vata: 0.5, pitta: 0.3, kapha: 0.2 },
        doshaType: {
          type: 'single',
          primary: 'vata',
          secondary: 'pitta',
          tertiary: 'kapha',
        },
        elementScores: null,
        primaryElement: null,
        secondaryElement: null,
        metabolicType: null,
        ansDominance: null,
        completeness: 0.5,
        confidence: 0.8,
        summary: 'Vata dominant',
      },
      debug: {
        rawVata: 15,
        rawPitta: 9,
        rawKapha: 6,
        totalWeight: 30,
        perQuestionDominant: ['vata', 'pitta', 'vata'],
        consistencyRatio: 0.67,
        classificationPath: 'single',
        elementRawScores: null,
      },
    };
    expect(cr.profile).toBeDefined();
    expect(cr.debug).toBeDefined();

    // OrganClockResult
    const ocr: OrganClockResult = {
      context: {
        activeOrgan: 'Liver',
        pairedOrgan: 'Gallbladder',
        element: 'wood',
        isDigestiveWindow: false,
        isWindDownWindow: false,
      },
      debug: {
        inputHour: 2,
        inputTimezone: 'America/Toronto',
        matchedEntry: 1,
      },
    };
    expect(ocr.context).toBeDefined();
    expect(ocr.debug).toBeDefined();

    // WeatherResult
    const wr: WeatherResult = {
      context: {
        thermalNeed: 0.6,
        kaphaAggravation: 0.3,
        vataAggravation: 0.5,
        pittaAggravation: 0.1,
        tcmWindPattern: 'none',
      },
      debug: {
        rawThermalNeed: 0.65,
        rawKaphaAggravation: 0.35,
        rawHumidityVata: 0.2,
        rawWindVata: 0.4,
        rawPittaAggravation: 0.12,
        combinedVataAggravation: 0.5,
        windPatternInputs: { windSpeed: 3.5, temp: 10 },
      },
    };
    expect(wr.context).toBeDefined();
    expect(wr.debug).toBeDefined();

    // ConvergenceResult
    const cvr: ConvergenceResult = {
      report: {
        score: 0.75,
        agreementCount: 2,
        interestingDivergence: true,
        dimensions: {
          thermal: { agrees: true, detail: 'Both warming' },
          constitutional: { agrees: false, detail: 'Dosha mismatch' },
          seasonal: { agrees: true, detail: 'Both in season' },
          evidence: { agrees: true, detail: 'Strong evidence' },
        },
      },
      debug: {
        doshaFitScore: 0.8,
        elementFitScore: 0.6,
        seasonalFitScoreAyurveda: 0.7,
        seasonalFitScoreTCM: 0.5,
        ayurvedaThermal: 'ushna',
        tcmThermal: 'warm',
        evidenceLevelRaw: 'strong',
        metabolicAffinityScore: 0.65,
      },
    };
    expect(cvr.report).toBeDefined();
    expect(cvr.debug).toBeDefined();
  });
});
