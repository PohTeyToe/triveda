/**
 * Barrel export verification -- ensures all public API symbols are
 * importable from the scoring package barrel (index.ts).
 *
 * Compile-time checks for types, runtime checks for functions/constants.
 */

import { describe, expect, it } from 'vitest';

import {
  ALWAYS_ACTIVE_COUNT,
  DECAY_STEPS,
  // Constants
  FACTOR_WEIGHTS,
  GENERATING_CYCLE,
  GENERATING_ELEMENT_THRESHOLD,
  HARD_REJECT_DAYS,
  MODIFIER_CLAMP,
  NEUTRAL_SCORE,
  PRIMARY_ELEMENT_WEIGHT,
  SCORE_CLAMP,
  SECONDARY_ELEMENT_WEIGHT,
  THERMAL_VALUES,
  antiRepetitionScore,
  applyModifiers,
  buildTelemetry,
  computeCompositeModifier,
  constitutionalFitScore,
  daysBetween,
  elementFitScore,
  emitCredits,
  explainScore,
  filterAllergies,
  filterCandidates,
  filterDislikes,
  filterRestrictions,
  isGeneratingElement,
  organClockScore,
  scoreCandidates,
  // Functions
  scoreFood,
  seasonalScore,
  selectTopN,
  weatherScore,
} from '../index.js';

// Type-only imports -- these verify compile-time availability.
// If any type is missing from the barrel, TypeScript compilation fails.
import type {
  ConstitutionalProfile,
  Contribution,
  CreditSource,
  Dosha,
  DoshaProfile,
  FactorBreakdown,
  FactorDetail,
  FoodAyurveda,
  FoodFeedback,
  FoodForScoring,
  FoodTCM,
  ModifierResult,
  ModifierValues,
  Ritu,
  ScoreBreakdown,
  ScoredFood,
  ScoringContext,
  ScoringTelemetry,
  TCMElement,
  ThermalNature,
} from '../index.js';

// ---------------------------------------------------------------------------
// Ensure types are usable at compile time (no runtime check needed --
// this block existing without TS errors is the assertion)
// ---------------------------------------------------------------------------

function _typeCheck(): void {
  // These assignments verify that the types resolve correctly
  const _dosha: Dosha = 'vata';
  const _ritu: Ritu = 'hemanta';
  const _element: TCMElement = 'wood';
  const _thermal: ThermalNature = 'warm';
  const _contribution: Contribution = 'active';
  const _doshaProfile: DoshaProfile = { vata: 0.5, pitta: 0.3, kapha: 0.2 };

  // Suppress unused variable warnings
  void _dosha;
  void _ritu;
  void _element;
  void _thermal;
  void _contribution;
  void _doshaProfile;
}

// Suppress unused function warning
void _typeCheck;

// ---------------------------------------------------------------------------
// Runtime checks
// ---------------------------------------------------------------------------

describe('barrel export: functions', () => {
  const functions = {
    scoreFood,
    scoreCandidates,
    selectTopN,
    explainScore,
    emitCredits,
    filterCandidates,
    filterRestrictions,
    filterAllergies,
    filterDislikes,
    constitutionalFitScore,
    seasonalScore,
    weatherScore,
    elementFitScore,
    antiRepetitionScore,
    organClockScore,
    computeCompositeModifier,
    applyModifiers,
    buildTelemetry,
    daysBetween,
    isGeneratingElement,
  };

  for (const [name, fn] of Object.entries(functions)) {
    it(`${name} is a function`, () => {
      expect(typeof fn).toBe('function');
    });
  }
});

describe('barrel export: constants', () => {
  it('FACTOR_WEIGHTS is an object with 6 keys', () => {
    expect(typeof FACTOR_WEIGHTS).toBe('object');
    expect(Object.keys(FACTOR_WEIGHTS).length).toBe(6);
  });

  it('THERMAL_VALUES is an object with 5 keys', () => {
    expect(typeof THERMAL_VALUES).toBe('object');
    expect(Object.keys(THERMAL_VALUES).length).toBe(5);
  });

  it('GENERATING_CYCLE is an object with 5 keys', () => {
    expect(typeof GENERATING_CYCLE).toBe('object');
    expect(Object.keys(GENERATING_CYCLE).length).toBe(5);
  });

  it('DECAY_STEPS is an array with 3 entries', () => {
    expect(Array.isArray(DECAY_STEPS)).toBe(true);
    expect(DECAY_STEPS.length).toBe(3);
  });

  it('numeric constants are defined', () => {
    expect(typeof GENERATING_ELEMENT_THRESHOLD).toBe('number');
    expect(typeof PRIMARY_ELEMENT_WEIGHT).toBe('number');
    expect(typeof SECONDARY_ELEMENT_WEIGHT).toBe('number');
    expect(typeof NEUTRAL_SCORE).toBe('number');
    expect(typeof HARD_REJECT_DAYS).toBe('number');
    expect(typeof ALWAYS_ACTIVE_COUNT).toBe('number');
  });

  it('clamp objects have min and max', () => {
    expect(MODIFIER_CLAMP).toHaveProperty('min');
    expect(MODIFIER_CLAMP).toHaveProperty('max');
    expect(SCORE_CLAMP).toHaveProperty('min');
    expect(SCORE_CLAMP).toHaveProperty('max');
  });
});
