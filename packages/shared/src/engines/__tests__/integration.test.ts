/**
 * Integration tests for the deterministic engine pipeline.
 *
 * Covers:
 *   1. End-to-end composition smoke test (full pipeline with realistic fixtures)
 *   2. Partial profile integration (3 answers only)
 *   3. No-IO static analysis assertion (engine source files contain no IO imports)
 *   4. Performance sanity checks (all engines complete within budget)
 *   5. Consumer compile test (downstream API shape stability)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { Temporal } from 'temporal-polyfill';
import { describe, expect, it } from 'vitest';

import { scoreConstitution } from '../constitutional.js';
import { computeConvergence } from '../convergence.js';
import { getOrganClock } from '../organ-clock.js';
import { getSeasonalContext } from '../seasonal.js';
import { applyWeatherToDoshaProfile, mapWeather } from '../weather.js';

import type {
  Answer,
  ConstitutionalResult,
  ConvergenceReport,
  ConvergenceResult,
  DayContext,
  DoshaProfile,
  FoodForConvergence,
  OrganClockResult,
  SeasonalContext,
  SeasonalResult,
  WeatherInput,
  WeatherResult,
} from '../types.js';

import type { EngineCreditSource } from '../engine-credits.js';
import {
  CONVERGENCE_DETECTION_CREDIT,
  DOSHA_ANALYSIS_CREDIT,
  ENGINE_CREDITS,
  FIVE_ELEMENT_AFFINITY_CREDIT,
  ORGAN_CLOCK_TIMING_CREDIT,
  PROGRESSIVE_PROFILE_STATE_CREDIT,
  SEASONAL_MAPPING_CREDIT,
  WEATHER_ADJUSTMENT_CREDIT,
} from '../engine-credits.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** July 15, 2026 -- mid-Grishma (Northern Hemisphere) */
const TEST_DATE = Temporal.PlainDate.from('2026-07-15');
const TEST_LATITUDE = 43.65; // Toronto

/** 8:00 AM local time in Toronto */
const TEST_DATETIME = Temporal.ZonedDateTime.from('2026-07-15T08:00:00[America/Toronto]');

/** 18 complete answers producing a Pitta-dominant profile */
const FULL_ANSWERS: Answer[] = [
  // Dosha questions 1-10: mostly 'b' (pitta-dominant)
  { questionId: 1, choice: 'b' }, // medium, athletic
  { questionId: 2, choice: 'b' }, // warm, oily, sensitive
  { questionId: 3, choice: 'b' }, // moderate sleeper
  { questionId: 4, choice: 'b' }, // strong, sharp digestion
  { questionId: 5, choice: 'b' }, // dislikes heat
  { questionId: 6, choice: 'b' }, // irritable, angry
  { questionId: 7, choice: 'b' }, // focused and driven
  { questionId: 8, choice: 'b' }, // sharp, precise speech
  { questionId: 9, choice: 'b' }, // strong appetite
  { questionId: 10, choice: 'b' }, // gains/loses easily
  // Element questions 11-15: fire-dominant
  { questionId: 11, choice: 'b' }, // summer overheat
  { questionId: 12, choice: 'b' }, // anxiety/joy swings
  { questionId: 13, choice: 'b' }, // heart, circulation
  { questionId: 14, choice: 'b' }, // late morning peak
  { questionId: 15, choice: 'b' }, // bitter craving
  // Metabolic questions 16-18: fast oxidizer, sympathetic
  { questionId: 16, choice: 'a' }, // fast oxidizer
  { questionId: 17, choice: 'a' }, // sympathetic
  { questionId: 18, choice: 'a' }, // quick recovery
];

/** Partial answers: only 3 dosha questions */
const PARTIAL_ANSWERS: Answer[] = [
  { questionId: 1, choice: 'a' },
  { questionId: 2, choice: 'a' },
  { questionId: 3, choice: 'a' },
];

/** Hot summer weather in Toronto */
const TEST_WEATHER: WeatherInput = {
  tempCelsius: 28,
  humidityPercent: 65,
  windSpeedMs: 3,
};

/** Ginger: warming in both traditions, moderate evidence */
const GINGER_FOOD: FoodForConvergence = {
  ayurveda: {
    virya: 'ushna',
    vataEffect: -0.5, // reduces vata (good for vata types)
    pittaEffect: 0.3, // slightly aggravates pitta
    kaphaEffect: -0.7, // reduces kapha
    seasonalFit: {
      shishira: 0.9,
      vasanta: 0.7,
      grishma: 0.3,
      varsha: 0.6,
      sharad: 0.5,
      hemanta: 0.9,
    },
  },
  tcm: {
    thermalNature: 'warm',
    elementFit: {
      wood: 0.4,
      fire: 0.7,
      earth: 0.6,
      metal: 0.5,
      water: 0.3,
    },
  },
  naturopathy: {
    evidenceLevel: 'moderate',
    metabolicTypeAffinity: {
      fast_oxidizer: 0.7,
      slow_oxidizer: 0.4,
      mixed_oxidizer: 0.5,
    },
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sumDosha(p: DoshaProfile): number {
  return p.vata + p.pitta + p.kapha;
}

// ---------------------------------------------------------------------------
// 1. End-to-end composition smoke test
// ---------------------------------------------------------------------------

describe('end-to-end composition smoke test', () => {
  let seasonal: SeasonalResult;
  let constitution: ConstitutionalResult;
  let organClock: OrganClockResult;
  let weather: WeatherResult;
  let dayContext: DayContext;
  let convergence: ConvergenceResult;

  // Run the full pipeline once, then assert on results
  it('full pipeline executes without throwing', () => {
    seasonal = getSeasonalContext(TEST_DATE, TEST_LATITUDE);
    constitution = scoreConstitution(FULL_ANSWERS);
    organClock = getOrganClock(TEST_DATETIME);
    weather = mapWeather(TEST_WEATHER);

    dayContext = {
      seasonal: seasonal.context,
      weather: weather.context,
      organClock: organClock.context,
    };

    convergence = computeConvergence(GINGER_FOOD, constitution.profile, dayContext);
  });

  it('seasonal returns valid context for July in Toronto', () => {
    expect(seasonal.context).toBeDefined();
    // Day 196 (July 15) falls at the start of Varsha (196-257)
    expect(seasonal.context.ayurvedaRitu).toBe('varsha');
    expect(seasonal.context.tcmPhase).toBe('fire');
    expect(seasonal.context.seasonalIntensity).toBeGreaterThanOrEqual(0.3);
    expect(seasonal.context.seasonalIntensity).toBeLessThanOrEqual(1.0);
  });

  it('constitutional returns valid pitta-dominant profile with completeness 1.0', () => {
    expect(constitution.profile).toBeDefined();
    expect(constitution.profile.completeness).toBe(1.0);
    expect(constitution.profile.doshaType.primary).toBe('pitta');
    expect(Math.abs(sumDosha(constitution.profile.doshaScores) - 1.0)).toBeLessThan(0.001);
    expect(constitution.profile.elementScores).not.toBeNull();
    expect(constitution.profile.metabolicType).toBe('fast_oxidizer');
    expect(constitution.profile.ansDominance).toBe('sympathetic');
    expect(constitution.profile.confidence).toBeGreaterThanOrEqual(0.5);
    expect(constitution.profile.confidence).toBeLessThanOrEqual(0.9);
    expect(constitution.profile.summary.length).toBeGreaterThan(0);
  });

  it('organ clock returns stomach at 8 AM Toronto time', () => {
    expect(organClock.context).toBeDefined();
    expect(organClock.context.activeOrgan).toBe('stomach');
    expect(organClock.context.element).toBe('earth');
    expect(organClock.context.isDigestiveWindow).toBe(true);
    expect(organClock.context.isWindDownWindow).toBe(false);
  });

  it('weather returns valid context for 28C/65%/3ms', () => {
    expect(weather.context).toBeDefined();
    // 28C is right at pitta threshold; some pitta aggravation expected
    expect(weather.context.thermalNeed).toBeLessThan(0);
    // Wind at 3 m/s is below the 5 m/s pattern threshold
    expect(weather.context.tcmWindPattern).toBe('none');
  });

  it('applyWeatherToDoshaProfile returns normalized profile', () => {
    const shifted = applyWeatherToDoshaProfile(constitution.profile.doshaScores, weather.context);
    expect(Math.abs(sumDosha(shifted) - 1.0)).toBeLessThan(0.001);
  });

  it('DayContext assembles from engine outputs without error', () => {
    expect(dayContext.seasonal).toBe(seasonal.context);
    expect(dayContext.weather).toBe(weather.context);
    expect(dayContext.organClock).toBe(organClock.context);
  });

  it('convergence accepts all outputs and returns valid report', () => {
    expect(convergence.report).toBeDefined();
    expect(convergence.report.score).toBeGreaterThanOrEqual(0);
    expect(convergence.report.score).toBeLessThanOrEqual(1);
    expect(convergence.report.agreementCount).toBeGreaterThanOrEqual(0);
    expect(convergence.report.agreementCount).toBeLessThanOrEqual(4);
    expect(typeof convergence.report.interestingDivergence).toBe('boolean');
    // All four dimensions populated
    expect(convergence.report.dimensions.thermal).toBeDefined();
    expect(convergence.report.dimensions.constitutional).toBeDefined();
    expect(convergence.report.dimensions.seasonal).toBeDefined();
    expect(convergence.report.dimensions.evidence).toBeDefined();
    // Each dimension has agrees (boolean) and detail (string)
    for (const dim of Object.values(convergence.report.dimensions)) {
      expect(typeof dim.agrees).toBe('boolean');
      expect(typeof dim.detail).toBe('string');
      expect(dim.detail.length).toBeGreaterThan(0);
    }
  });

  it('all debug objects are populated', () => {
    // Seasonal debug
    expect(seasonal.debug).toBeDefined();
    expect(typeof seasonal.debug.adjustedDayOfYear).toBe('number');
    expect(typeof seasonal.debug.rawDayOfYear).toBe('number');
    expect(typeof seasonal.debug.hemisphereOffset).toBe('number');

    // Constitutional debug
    expect(constitution.debug).toBeDefined();
    expect(typeof constitution.debug.rawVata).toBe('number');
    expect(typeof constitution.debug.rawPitta).toBe('number');
    expect(typeof constitution.debug.rawKapha).toBe('number');
    expect(constitution.debug.perQuestionDominant.length).toBe(10);

    // Organ clock debug
    expect(organClock.debug).toBeDefined();
    expect(organClock.debug.inputHour).toBe(8);
    expect(organClock.debug.inputTimezone).toBe('America/Toronto');

    // Weather debug
    expect(weather.debug).toBeDefined();
    expect(typeof weather.debug.rawThermalNeed).toBe('number');
    expect(typeof weather.debug.combinedVataAggravation).toBe('number');

    // Convergence debug
    expect(convergence.debug).toBeDefined();
    expect(typeof convergence.debug.doshaFitScore).toBe('number');
    expect(typeof convergence.debug.seasonalFitScoreAyurveda).toBe('number');
    expect(typeof convergence.debug.seasonalFitScoreTCM).toBe('number');
    expect(convergence.debug.ayurvedaThermal).toBe('warming');
    expect(convergence.debug.tcmThermal).toBe('warming');
    expect(convergence.debug.evidenceLevelRaw).toBe('moderate');
  });

  it('dosha scores sum to 1.0 across pipeline', () => {
    expect(Math.abs(sumDosha(constitution.profile.doshaScores) - 1.0)).toBeLessThan(0.001);
  });

  it('seasonal intensity is between 0.3 and 1.0', () => {
    expect(seasonal.context.seasonalIntensity).toBeGreaterThanOrEqual(0.3);
    expect(seasonal.context.seasonalIntensity).toBeLessThanOrEqual(1.0);
  });
});

// ---------------------------------------------------------------------------
// 2. Partial profile integration
// ---------------------------------------------------------------------------

describe('partial profile integration (3 answers)', () => {
  let constitution: ConstitutionalResult;
  let convergence: ConvergenceResult;

  it('scoreConstitution with 3 answers returns valid profile', () => {
    constitution = scoreConstitution(PARTIAL_ANSWERS);
    expect(constitution.profile).toBeDefined();
    // 3 / 18 ~ 0.1667
    expect(constitution.profile.completeness).toBeCloseTo(3 / 18, 3);
    // Only dosha questions answered -- no elements, no metabolic
    expect(constitution.profile.elementScores).toBeNull();
    expect(constitution.profile.metabolicType).toBeNull();
    expect(constitution.profile.ansDominance).toBeNull();
    // Dosha scores still sum to 1.0
    expect(Math.abs(sumDosha(constitution.profile.doshaScores) - 1.0)).toBeLessThan(0.001);
  });

  it('computeConvergence works with partial profile', () => {
    const seasonal = getSeasonalContext(TEST_DATE, TEST_LATITUDE);
    const weather = mapWeather(TEST_WEATHER);
    const organClock = getOrganClock(TEST_DATETIME);

    const dayContext: DayContext = {
      seasonal: seasonal.context,
      weather: weather.context,
      organClock: organClock.context,
    };

    convergence = computeConvergence(GINGER_FOOD, constitution.profile, dayContext);

    expect(convergence.report).toBeDefined();
    expect(convergence.report.score).toBeGreaterThanOrEqual(0);
    expect(convergence.report.score).toBeLessThanOrEqual(1);
  });

  it('evidence dimension returns "not yet assessable" for incomplete profile', () => {
    expect(convergence.report.dimensions.evidence.detail).toContain('not yet assessable');
    // Evidence agrees by default when not assessable
    expect(convergence.report.dimensions.evidence.agrees).toBe(true);
  });

  it('no exceptions thrown across partial pipeline', () => {
    // This test is implicit -- if the tests above ran without throwing,
    // the pipeline handles partial profiles gracefully. Explicit assertion:
    expect(convergence).toBeDefined();
    expect(constitution).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 3. No-IO static analysis assertion
// ---------------------------------------------------------------------------

describe('no-IO static analysis', () => {
  // Resolve engine source directory relative to this test file
  const enginesDir = path.resolve(__dirname, '..');

  /**
   * Collect all .ts source files under engines/ (excluding tests, fixtures,
   * and __tests__ directory).
   */
  function collectSourceFiles(): string[] {
    const files: string[] = [];

    function walk(dir: string): void {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          // Skip __tests__ and fixtures directories
          if (entry.name === '__tests__' || entry.name === 'fixtures') continue;
          walk(fullPath);
        } else if (
          entry.name.endsWith('.ts') &&
          !entry.name.endsWith('.test.ts') &&
          !entry.name.endsWith('.spec.ts')
        ) {
          files.push(fullPath);
        }
      }
    }

    walk(enginesDir);
    return files;
  }

  const forbiddenImports = [
    /from\s+['"]node:fs['"]/,
    /from\s+['"]node:http['"]/,
    /from\s+['"]node:https['"]/,
    /from\s+['"]node:net['"]/,
    /from\s+['"]node:child_process['"]/,
    /from\s+['"]fs['"]/,
    /from\s+['"]http['"]/,
    /from\s+['"]https['"]/,
    /from\s+['"]net['"]/,
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
  ];

  it('engine source files contain no IO-capable imports or calls', () => {
    const sourceFiles = collectSourceFiles();
    expect(sourceFiles.length).toBeGreaterThan(0);

    const violations: string[] = [];

    for (const filePath of sourceFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(enginesDir, filePath);

      for (const pattern of forbiddenImports) {
        if (pattern.test(content)) {
          violations.push(`${relativePath} matches forbidden pattern: ${pattern.source}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 4. Performance sanity checks
// ---------------------------------------------------------------------------

describe('performance -- all engines within budget', () => {
  it('getSeasonalContext completes within 5ms', () => {
    const start = performance.now();
    getSeasonalContext(TEST_DATE, TEST_LATITUDE);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(5);
  });

  it('scoreConstitution with 18 answers completes within 5ms', () => {
    const start = performance.now();
    scoreConstitution(FULL_ANSWERS);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(5);
  });

  it('getOrganClock completes within 1ms', () => {
    const start = performance.now();
    getOrganClock(TEST_DATETIME);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(1);
  });

  it('mapWeather completes within 1ms', () => {
    const start = performance.now();
    mapWeather(TEST_WEATHER);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(1);
  });

  it('computeConvergence completes within 5ms', () => {
    const constitution = scoreConstitution(FULL_ANSWERS);
    const seasonal = getSeasonalContext(TEST_DATE, TEST_LATITUDE);
    const weather = mapWeather(TEST_WEATHER);
    const organClock = getOrganClock(TEST_DATETIME);

    const dayContext: DayContext = {
      seasonal: seasonal.context,
      weather: weather.context,
      organClock: organClock.context,
    };

    const start = performance.now();
    computeConvergence(GINGER_FOOD, constitution.profile, dayContext);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(5);
  });

  it('full pipeline completes within 10ms for a single food', () => {
    const start = performance.now();

    const seasonal = getSeasonalContext(TEST_DATE, TEST_LATITUDE);
    const constitution = scoreConstitution(FULL_ANSWERS);
    const organClock = getOrganClock(TEST_DATETIME);
    const weather = mapWeather(TEST_WEATHER);
    applyWeatherToDoshaProfile(constitution.profile.doshaScores, weather.context);
    const dayContext: DayContext = {
      seasonal: seasonal.context,
      weather: weather.context,
      organClock: organClock.context,
    };
    computeConvergence(GINGER_FOOD, constitution.profile, dayContext);

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(10);
  });
});

// ---------------------------------------------------------------------------
// 5. Consumer compile test (API shape stability)
// ---------------------------------------------------------------------------

describe('consumer compile test -- downstream API shape', () => {
  it('getSeasonalContext accepts typed arguments and returns SeasonalResult', () => {
    const result: SeasonalResult = getSeasonalContext(TEST_DATE, TEST_LATITUDE);
    // Verify SeasonalContext shape
    const ctx: SeasonalContext = result.context;
    expect(typeof ctx.ayurvedaRitu).toBe('string');
    expect(typeof ctx.tcmPhase).toBe('string');
    expect(typeof ctx.isTransition).toBe('boolean');
    expect(typeof ctx.transitionProgress).toBe('number');
    expect(typeof ctx.seasonalIntensity).toBe('number');
  });

  it('DayContext is constructable from engine outputs', () => {
    const seasonal = getSeasonalContext(TEST_DATE, TEST_LATITUDE);
    const weather = mapWeather(TEST_WEATHER);
    const organClock = getOrganClock(TEST_DATETIME);

    const dc: DayContext = {
      seasonal: seasonal.context,
      weather: weather.context,
      organClock: organClock.context,
    };
    expect(dc.seasonal).toBeDefined();
    expect(dc.weather).toBeDefined();
    expect(dc.organClock).toBeDefined();
  });

  it('ConvergenceReport dimensions.thermal.agrees is accessible', () => {
    const seasonal = getSeasonalContext(TEST_DATE, TEST_LATITUDE);
    const weather = mapWeather(TEST_WEATHER);
    const organClock = getOrganClock(TEST_DATETIME);
    const constitution = scoreConstitution(FULL_ANSWERS);

    const dayContext: DayContext = {
      seasonal: seasonal.context,
      weather: weather.context,
      organClock: organClock.context,
    };

    const result: ConvergenceResult = computeConvergence(
      GINGER_FOOD,
      constitution.profile,
      dayContext,
    );
    const report: ConvergenceReport = result.report;
    // Access nested field -- compile test
    const agrees: boolean = report.dimensions.thermal.agrees;
    expect(typeof agrees).toBe('boolean');
  });

  it('all 7 engine credit constants have id and label fields', () => {
    const credits: EngineCreditSource[] = [
      SEASONAL_MAPPING_CREDIT,
      ORGAN_CLOCK_TIMING_CREDIT,
      WEATHER_ADJUSTMENT_CREDIT,
      DOSHA_ANALYSIS_CREDIT,
      FIVE_ELEMENT_AFFINITY_CREDIT,
      CONVERGENCE_DETECTION_CREDIT,
      PROGRESSIVE_PROFILE_STATE_CREDIT,
    ];

    for (const credit of credits) {
      expect(typeof credit.id).toBe('string');
      expect(credit.id.length).toBeGreaterThan(0);
      expect(typeof credit.label).toBe('string');
      expect(credit.label.length).toBeGreaterThan(0);
    }
  });

  it('ENGINE_CREDITS array has 7 entries with consistent shape', () => {
    expect(ENGINE_CREDITS).toHaveLength(7);
    for (const credit of ENGINE_CREDITS) {
      expect(credit).toHaveProperty('id');
      expect(credit).toHaveProperty('label');
      expect(credit).toHaveProperty('description');
      expect(credit).toHaveProperty('sourceEngine');
      expect(credit).toHaveProperty('trigger');
    }
  });

  it('FoodForConvergence fixture satisfies the type', () => {
    // If this compiles, the fixture matches the type
    const food: FoodForConvergence = {
      ayurveda: {
        virya: 'sheeta',
        vataEffect: 0.2,
        pittaEffect: -0.5,
        kaphaEffect: 0.3,
        seasonalFit: {
          shishira: 0.4,
          vasanta: 0.6,
          grishma: 0.9,
          varsha: 0.5,
          sharad: 0.7,
          hemanta: 0.3,
        },
      },
      tcm: {
        thermalNature: 'cool',
        elementFit: {
          wood: 0.5,
          fire: 0.3,
          earth: 0.6,
          metal: 0.4,
          water: 0.7,
        },
      },
      naturopathy: {
        evidenceLevel: 'strong',
        metabolicTypeAffinity: {
          fast_oxidizer: 0.3,
          slow_oxidizer: 0.8,
          mixed_oxidizer: 0.5,
        },
      },
    };
    expect(food).toBeDefined();
  });
});
