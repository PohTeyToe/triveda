import { describe, expect, it } from 'vitest';
import type { CreditSource } from '../../credits.js';
import {
  DECAY_STEPS,
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
} from '../factors/constants.js';
import type { DecayStep, FactorName } from '../factors/constants.js';
import type {
  Contribution,
  Dosha,
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
} from '../types.js';

// ---------------------------------------------------------------------------
// Compile-time type tests
// ---------------------------------------------------------------------------

describe('compile-time type tests', () => {
  it('ScoredFood includes all required fields', () => {
    const scored: ScoredFood = {
      foodId: 'abc',
      foodName: 'Ginger',
      totalScore: 0.85,
      baseScore: 0.75,
      breakdown: {
        constitutional: { weight: 0.3, rawScore: 0.8, weightedScore: 0.24, rationale: 'test' },
        seasonal: { weight: 0.2, rawScore: 0.7, weightedScore: 0.14, rationale: 'test' },
        weather: { weight: 0.15, rawScore: 0.6, weightedScore: 0.09, rationale: 'test' },
        element: { weight: 0.15, rawScore: 0.5, weightedScore: 0.075, rationale: 'test' },
        antiRepetition: { weight: 0.12, rawScore: 1.0, weightedScore: 0.12, rationale: 'test' },
        organClock: { weight: 0.08, rawScore: 0.9, weightedScore: 0.072, rationale: 'test' },
      },
      modifiers: [],
      credits: [],
    };

    expect(scored.foodId).toBe('abc');
    expect(scored.foodName).toBe('Ginger');
    expect(scored.totalScore).toBe(0.85);
    expect(scored.baseScore).toBe(0.75);
    expect(scored.breakdown).toBeDefined();
    expect(scored.modifiers).toBeDefined();
    expect(scored.credits).toBeDefined();
  });

  it('FactorBreakdown has all 6 factors', () => {
    const breakdown: FactorBreakdown = {
      constitutional: { weight: 0.3, rawScore: 0, weightedScore: 0, rationale: '' },
      seasonal: { weight: 0.2, rawScore: 0, weightedScore: 0, rationale: '' },
      weather: { weight: 0.15, rawScore: 0, weightedScore: 0, rationale: '' },
      element: { weight: 0.15, rawScore: 0, weightedScore: 0, rationale: '' },
      antiRepetition: { weight: 0.12, rawScore: 0, weightedScore: 0, rationale: '' },
      organClock: { weight: 0.08, rawScore: 0, weightedScore: 0, rationale: '' },
    };

    const keys = Object.keys(breakdown);
    expect(keys).toHaveLength(6);
    expect(keys).toContain('constitutional');
    expect(keys).toContain('seasonal');
    expect(keys).toContain('weather');
    expect(keys).toContain('element');
    expect(keys).toContain('antiRepetition');
    expect(keys).toContain('organClock');
  });

  it('FoodForScoring includes all required fields', () => {
    const food: FoodForScoring = {
      id: '123',
      name: 'Rice',
      tags: ['grain'],
      contraindications: undefined,
      ayurveda: {
        vataEffect: -1,
        pittaEffect: 0,
        kaphaEffect: 1,
        rituFit: {
          shishira: 0.5,
          vasanta: 0.6,
          grishma: 0.3,
          varsha: 0.7,
          sharad: 0.8,
          hemanta: 0.9,
        },
      },
      tcm: {
        thermalNature: 'neutral',
        organAffinity: ['stomach', 'spleen'],
        elementFit: { wood: 0.2, fire: 0.3, earth: 0.8, metal: 0.4, water: 0.3 },
      },
    };

    expect(food.id).toBe('123');
    expect(food.tcm.thermalNature).toBe('neutral');
  });

  it('ScoringContext includes all required fields', () => {
    const ctx: ScoringContext = {
      seasonal: {
        ayurvedaRitu: 'vasanta',
        tcmPhase: 'wood',
        isTransition: false,
        transitionProgress: 0,
        seasonalIntensity: 0.8,
      },
      weather: {
        thermalNeed: 0.3,
        kaphaAggravation: 0.2,
        vataAggravation: 0.1,
        pittaAggravation: 0.4,
        tcmWindPattern: 'none',
      },
      organClock: {
        activeOrgan: 'stomach',
        pairedOrgan: 'spleen',
        element: 'earth',
        isDigestiveWindow: true,
        isWindDownWindow: false,
      },
      recentFoods: [],
      dietaryRestrictions: [],
      allergies: [],
      explicitDislikes: [],
      today: '2026-04-12',
    };

    expect(ctx.seasonal.ayurvedaRitu).toBe('vasanta');
    expect(ctx.today).toBe('2026-04-12');
  });

  it('ModifierValues accepts optional fields', () => {
    const empty: ModifierValues = {
      bloodWork: undefined,
      culturalMatch: undefined,
      dailyCheckIn: undefined,
    };
    expect(empty.bloodWork).toBeUndefined();

    const partial: ModifierValues = {
      bloodWork: 1.05,
      culturalMatch: undefined,
      dailyCheckIn: 1.0,
    };
    expect(partial.bloodWork).toBe(1.05);
  });

  it('ScoreBreakdown has factors array with attribution', () => {
    const debug: ScoreBreakdown = {
      foodId: 'x',
      foodName: 'Test',
      totalScore: 0.9,
      baseScore: 0.8,
      factors: [
        {
          name: 'constitutional',
          weight: 0.3,
          rawScore: 0.8,
          weightedScore: 0.24,
          attribution: 0.09,
          rationale: '',
        },
      ],
      modifiers: [],
      credits: [],
    };
    expect(debug.factors[0].attribution).toBe(0.09);
  });

  it('ScoringTelemetry has all fields', () => {
    const telemetry: ScoringTelemetry = {
      inputsHash: 'abc123',
      durationMs: 42,
      foodCount: 50,
      filteredCount: 5,
      scoredCount: 45,
      topScore: 1.15,
      bottomScore: 0.2,
      activeCreditsCount: 12,
    };
    expect(telemetry.foodCount).toBe(50);
  });

  it('string union types accept valid values', () => {
    const d: Dosha = 'vata';
    const t: ThermalNature = 'warm';
    const c: Contribution = 'active';
    const r: Ritu = 'hemanta';
    const e: TCMElement = 'metal';

    expect(d).toBe('vata');
    expect(t).toBe('warm');
    expect(c).toBe('active');
    expect(r).toBe('hemanta');
    expect(e).toBe('metal');
  });
});

// ---------------------------------------------------------------------------
// Constants runtime tests
// ---------------------------------------------------------------------------

describe('FACTOR_WEIGHTS', () => {
  it('values sum to 1.0', () => {
    const sum = Object.values(FACTOR_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 10);
  });

  it('has exactly 6 factors', () => {
    expect(Object.keys(FACTOR_WEIGHTS)).toHaveLength(6);
  });

  it('all values are positive', () => {
    for (const v of Object.values(FACTOR_WEIGHTS)) {
      expect(v).toBeGreaterThan(0);
    }
  });

  it('is frozen', () => {
    expect(Object.isFrozen(FACTOR_WEIGHTS)).toBe(true);
  });

  it('has expected individual weights', () => {
    expect(FACTOR_WEIGHTS.constitutional).toBe(0.3);
    expect(FACTOR_WEIGHTS.seasonal).toBe(0.2);
    expect(FACTOR_WEIGHTS.weather).toBe(0.15);
    expect(FACTOR_WEIGHTS.element).toBe(0.15);
    expect(FACTOR_WEIGHTS.antiRepetition).toBe(0.12);
    expect(FACTOR_WEIGHTS.organClock).toBe(0.08);
  });
});

describe('THERMAL_VALUES', () => {
  it('has entries for all 5 thermal natures', () => {
    const natures: ThermalNature[] = ['hot', 'warm', 'neutral', 'cool', 'cold'];
    for (const n of natures) {
      expect(THERMAL_VALUES).toHaveProperty(n);
    }
  });

  it('ranges from -1 to +1', () => {
    expect(THERMAL_VALUES.cold).toBe(-1.0);
    expect(THERMAL_VALUES.cool).toBe(-0.5);
    expect(THERMAL_VALUES.neutral).toBe(0.0);
    expect(THERMAL_VALUES.warm).toBe(0.5);
    expect(THERMAL_VALUES.hot).toBe(1.0);
  });

  it('is frozen', () => {
    expect(Object.isFrozen(THERMAL_VALUES)).toBe(true);
  });
});

describe('DECAY_STEPS', () => {
  it('has 3 entries', () => {
    expect(DECAY_STEPS).toHaveLength(3);
  });

  it('covers all threshold boundaries', () => {
    const maxDays = DECAY_STEPS.map((s) => s.maxDays);
    expect(maxDays).toEqual([1, 3, 7]);
  });

  it('scores increase with maxDays', () => {
    for (let i = 1; i < DECAY_STEPS.length; i++) {
      expect(DECAY_STEPS[i].score).toBeGreaterThan(DECAY_STEPS[i - 1].score);
    }
  });

  it('all scores are in (0, 1)', () => {
    for (const step of DECAY_STEPS) {
      expect(step.score).toBeGreaterThan(0);
      expect(step.score).toBeLessThan(1);
    }
  });
});

describe('GENERATING_CYCLE', () => {
  it('has entries for all 5 elements', () => {
    const elements: TCMElement[] = ['wood', 'fire', 'earth', 'metal', 'water'];
    for (const el of elements) {
      expect(GENERATING_CYCLE).toHaveProperty(el);
    }
  });

  it('maps each element to its mother element', () => {
    expect(GENERATING_CYCLE.wood).toBe('water');
    expect(GENERATING_CYCLE.fire).toBe('wood');
    expect(GENERATING_CYCLE.earth).toBe('fire');
    expect(GENERATING_CYCLE.metal).toBe('earth');
    expect(GENERATING_CYCLE.water).toBe('metal');
  });

  it('forms a complete cycle (every element appears as both key and value)', () => {
    const keys = new Set(Object.keys(GENERATING_CYCLE));
    const values = new Set(Object.values(GENERATING_CYCLE));
    expect(keys).toEqual(values);
  });

  it('is frozen', () => {
    expect(Object.isFrozen(GENERATING_CYCLE)).toBe(true);
  });
});

describe('scalar constants', () => {
  it('HARD_REJECT_DAYS is 14', () => {
    expect(HARD_REJECT_DAYS).toBe(14);
  });

  it('GENERATING_ELEMENT_THRESHOLD is 0.6', () => {
    expect(GENERATING_ELEMENT_THRESHOLD).toBe(0.6);
  });

  it('PRIMARY_ELEMENT_WEIGHT is 0.7', () => {
    expect(PRIMARY_ELEMENT_WEIGHT).toBe(0.7);
  });

  it('SECONDARY_ELEMENT_WEIGHT is 0.3', () => {
    expect(SECONDARY_ELEMENT_WEIGHT).toBe(0.3);
  });

  it('NEUTRAL_SCORE is 0.5', () => {
    expect(NEUTRAL_SCORE).toBe(0.5);
  });

  it('element weights sum to 1.0', () => {
    expect(PRIMARY_ELEMENT_WEIGHT + SECONDARY_ELEMENT_WEIGHT).toBeCloseTo(1.0, 10);
  });
});

describe('clamp bounds', () => {
  it('MODIFIER_CLAMP has min 0.8 and max 1.25', () => {
    expect(MODIFIER_CLAMP.min).toBe(0.8);
    expect(MODIFIER_CLAMP.max).toBe(1.25);
  });

  it('SCORE_CLAMP has min 0 and max 1.2', () => {
    expect(SCORE_CLAMP.min).toBe(0);
    expect(SCORE_CLAMP.max).toBe(1.2);
  });

  it('both are frozen', () => {
    expect(Object.isFrozen(MODIFIER_CLAMP)).toBe(true);
    expect(Object.isFrozen(SCORE_CLAMP)).toBe(true);
  });
});
