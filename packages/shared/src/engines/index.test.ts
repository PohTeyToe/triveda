import { describe, expect, it } from 'vitest';
import {
  // Zod schemas
  AnswerSchema,
  CONVERGENCE_DETECTION_CREDIT,
  DOSHA_ANALYSIS_CREDIT,
  ENGINE_CREDITS,
  FIVE_ELEMENT_AFFINITY_CREDIT,
  ORGAN_CLOCK_TIMING_CREDIT,
  PROGRESSIVE_PROFILE_STATE_CREDIT,
  // Credit sources
  SEASONAL_MAPPING_CREDIT,
  SeasonalInputSchema,
  WEATHER_ADJUSTMENT_CREDIT,
  WeatherInputSchema,
  clamp,
  // Utility functions
  fromDate,
  getDayOfYear,
  isLeapYear,
  linearInterpolate,
  mode,
  normalize,
} from './index.js';

import type {
  ANSDominance,
  Answer,
  AyurvedicQualities,
  ConstitutionAnswer,
  ConstitutionEngine,
  ConstitutionResult,
  ConstitutionalDebug,
  ConstitutionalProfile,
  ConstitutionalResult,
  ConvergenceDebug,
  ConvergenceDetector,
  ConvergenceReport,
  ConvergenceResult,
  DayContext,
  DimensionResult,
  // Types
  Dosha,
  DoshaClassification,
  DoshaProfile,
  ElementScores,
  EngineCreditSource,
  FoodForConvergence,
  MetabolicType,
  OrganClock,
  OrganClockContext,
  OrganClockDebug,
  OrganClockResult,
  OrganMeridian,
  Ritu,
  // Legacy types
  Season,
  SeasonEngine,
  SeasonalContext,
  SeasonalDebug,
  SeasonalResult,
  TCMElement,
  TCMPhase,
  ThermalNature,
  TraditionRecommendation,
  Virya,
  WeatherContext,
  WeatherData,
  WeatherDebug,
  WeatherInput,
  WeatherMapper,
  WeatherResult,
} from './index.js';

describe('barrel export -- runtime values', () => {
  it('exports Zod schemas', () => {
    expect(AnswerSchema).toBeDefined();
    expect(WeatherInputSchema).toBeDefined();
    expect(SeasonalInputSchema).toBeDefined();
  });

  it('exports utility functions', () => {
    expect(typeof fromDate).toBe('function');
    expect(typeof getDayOfYear).toBe('function');
    expect(typeof isLeapYear).toBe('function');
    expect(typeof clamp).toBe('function');
    expect(typeof normalize).toBe('function');
    expect(typeof mode).toBe('function');
    expect(typeof linearInterpolate).toBe('function');
  });

  it('exports all 7 individual credit source constants', () => {
    expect(SEASONAL_MAPPING_CREDIT).toBeDefined();
    expect(ORGAN_CLOCK_TIMING_CREDIT).toBeDefined();
    expect(WEATHER_ADJUSTMENT_CREDIT).toBeDefined();
    expect(DOSHA_ANALYSIS_CREDIT).toBeDefined();
    expect(FIVE_ELEMENT_AFFINITY_CREDIT).toBeDefined();
    expect(CONVERGENCE_DETECTION_CREDIT).toBeDefined();
    expect(PROGRESSIVE_PROFILE_STATE_CREDIT).toBeDefined();
  });

  it('exports ENGINE_CREDITS array with 7 entries', () => {
    expect(ENGINE_CREDITS).toHaveLength(7);
  });
});

describe('barrel export -- type assignability', () => {
  // These tests verify types are importable and assignable.
  // If the file compiles, the types are correctly re-exported.

  it('core output types are assignable', () => {
    const ctx: SeasonalContext = {
      ayurvedaRitu: 'vasanta',
      tcmPhase: 'wood',
      isTransition: false,
      transitionProgress: 0,
      seasonalIntensity: 0.8,
    };
    expect(ctx).toBeDefined();

    const dp: DoshaProfile = { vata: 0.4, pitta: 0.3, kapha: 0.3 };
    expect(dp).toBeDefined();

    const oc: OrganClockContext = {
      activeOrgan: 'Liver',
      pairedOrgan: 'Gallbladder',
      element: 'wood',
      isDigestiveWindow: false,
      isWindDownWindow: false,
    };
    expect(oc).toBeDefined();

    const wc: WeatherContext = {
      thermalNeed: 0.5,
      kaphaAggravation: 0.3,
      vataAggravation: 0.2,
      pittaAggravation: 0.1,
      tcmWindPattern: 'none',
    };
    expect(wc).toBeDefined();

    const cr: ConvergenceReport = {
      score: 0.8,
      agreementCount: 3,
      interestingDivergence: false,
      dimensions: {
        thermal: { agrees: true, detail: 'Both warming' },
        constitutional: { agrees: true, detail: 'Matches dosha' },
        seasonal: { agrees: true, detail: 'Both in season' },
        evidence: { agrees: false, detail: 'Weak evidence' },
      },
    };
    expect(cr).toBeDefined();

    const dc: DayContext = {
      seasonal: ctx,
      weather: wc,
      organClock: oc,
    };
    expect(dc).toBeDefined();
  });

  it('EngineCreditSource type is importable and assignable', () => {
    const credit: EngineCreditSource = SEASONAL_MAPPING_CREDIT;
    expect(credit.id).toBe('seasonal-ritu');
    expect(credit.sourceEngine).toBe('seasonal');
  });
});
