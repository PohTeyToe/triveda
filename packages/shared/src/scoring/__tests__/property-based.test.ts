/**
 * Property-based tests -- uses fast-check to verify scoring invariants
 * hold across hundreds of random inputs.
 *
 * 9 properties covering score bounds, determinism, weight normalization,
 * credit counts, filter semantics, factor ranges, and monotonicity.
 */

import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { constitutionalFitScore } from '../factors/constitutional.js';
import { filterRestrictions } from '../filters/restrictions.js';
import { scoreFood } from '../score-food.js';
import type {
  ConstitutionalProfile,
  FoodAyurveda,
  FoodForScoring,
  FoodTCM,
  ScoringContext,
} from '../types.js';

// ---------------------------------------------------------------------------
// Custom arbitraries
// ---------------------------------------------------------------------------

// fast-check v4 requires 32-bit float boundaries
const f = (n: number) => Math.fround(n);

const doshaProfileArb = fc
  .tuple(
    fc.float({ min: f(0.01), max: f(1), noNaN: true }),
    fc.float({ min: f(0.01), max: f(1), noNaN: true }),
    fc.float({ min: f(0.01), max: f(1), noNaN: true }),
  )
  .map(([v, p, k]) => {
    const sum = v + p + k;
    return { vata: v / sum, pitta: p / sum, kapha: k / sum };
  });

const foodAyurvedaArb: fc.Arbitrary<FoodAyurveda> = fc.record({
  vataEffect: fc.integer({ min: -2, max: 2 }),
  pittaEffect: fc.integer({ min: -2, max: 2 }),
  kaphaEffect: fc.integer({ min: -2, max: 2 }),
  rituFit: fc.record({
    shishira: fc.float({ min: f(0), max: f(1), noNaN: true }),
    vasanta: fc.float({ min: f(0), max: f(1), noNaN: true }),
    grishma: fc.float({ min: f(0), max: f(1), noNaN: true }),
    varsha: fc.float({ min: f(0), max: f(1), noNaN: true }),
    sharad: fc.float({ min: f(0), max: f(1), noNaN: true }),
    hemanta: fc.float({ min: f(0), max: f(1), noNaN: true }),
  }),
});

const foodTcmArb: fc.Arbitrary<FoodTCM> = fc.record({
  thermalNature: fc.constantFrom(
    'hot' as const,
    'warm' as const,
    'neutral' as const,
    'cool' as const,
    'cold' as const,
  ),
  organAffinity: fc.array(
    fc.constantFrom(
      'liver',
      'gallbladder',
      'heart',
      'small_intestine',
      'spleen',
      'stomach',
      'lung',
      'large_intestine',
      'kidney',
      'bladder',
      'pericardium',
      'triple_burner',
    ),
    { minLength: 1, maxLength: 3 },
  ),
  elementFit: fc.record({
    wood: fc.float({ min: f(0), max: f(1), noNaN: true }),
    fire: fc.float({ min: f(0), max: f(1), noNaN: true }),
    earth: fc.float({ min: f(0), max: f(1), noNaN: true }),
    metal: fc.float({ min: f(0), max: f(1), noNaN: true }),
    water: fc.float({ min: f(0), max: f(1), noNaN: true }),
  }),
});

const foodForScoringArb: fc.Arbitrary<FoodForScoring> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 30 }),
  tags: fc.array(fc.string({ minLength: 1, maxLength: 15 }), { maxLength: 5 }),
  contraindications: fc.constant(undefined),
  ayurveda: foodAyurvedaArb,
  tcm: foodTcmArb,
});

const tcmElementArb = fc.constantFrom(
  'wood' as const,
  'fire' as const,
  'earth' as const,
  'metal' as const,
  'water' as const,
);

const profileArb: fc.Arbitrary<ConstitutionalProfile> = fc.record({
  doshaScores: doshaProfileArb,
  doshaType: fc.record({
    type: fc.constantFrom('single' as const, 'dual' as const, 'tridoshic' as const),
    primary: fc.constantFrom('vata' as const, 'pitta' as const, 'kapha' as const),
    secondary: fc.constantFrom('vata' as const, 'pitta' as const, 'kapha' as const),
    tertiary: fc.constantFrom('vata' as const, 'pitta' as const, 'kapha' as const),
  }),
  elementScores: fc.oneof(
    fc.constant(null),
    fc.record({
      wood: fc.float({ min: f(0), max: f(1), noNaN: true }),
      fire: fc.float({ min: f(0), max: f(1), noNaN: true }),
      earth: fc.float({ min: f(0), max: f(1), noNaN: true }),
      metal: fc.float({ min: f(0), max: f(1), noNaN: true }),
      water: fc.float({ min: f(0), max: f(1), noNaN: true }),
    }),
  ),
  primaryElement: fc.oneof(fc.constant(null), tcmElementArb),
  secondaryElement: fc.oneof(fc.constant(null), tcmElementArb),
  metabolicType: fc.oneof(
    fc.constant(null),
    fc.constantFrom('fast_oxidizer' as const, 'slow_oxidizer' as const, 'mixed_oxidizer' as const),
  ),
  ansDominance: fc.oneof(
    fc.constant(null),
    fc.constantFrom('sympathetic' as const, 'parasympathetic' as const, 'balanced' as const),
  ),
  completeness: fc.float({ min: f(0), max: f(1), noNaN: true }),
  confidence: fc.float({ min: f(0), max: f(1), noNaN: true }),
  summary: fc.string({ minLength: 0, maxLength: 50 }),
});

// Ensure profile consistency: if primaryElement is null, secondaryElement is null too
const consistentProfileArb: fc.Arbitrary<ConstitutionalProfile> = profileArb.map((p) => {
  if (p.primaryElement === null) {
    return { ...p, secondaryElement: null, elementScores: null };
  }
  if (p.secondaryElement === null) {
    return { ...p, secondaryElement: p.primaryElement };
  }
  return p;
});

const scoringContextArb: fc.Arbitrary<ScoringContext> = fc.record({
  seasonal: fc.record({
    ayurvedaRitu: fc.constantFrom(
      'shishira' as const,
      'vasanta' as const,
      'grishma' as const,
      'varsha' as const,
      'sharad' as const,
      'hemanta' as const,
    ),
    tcmPhase: fc.constantFrom(
      'wood' as const,
      'fire' as const,
      'earth' as const,
      'metal' as const,
      'water' as const,
    ),
    isTransition: fc.constant(false),
    transitionProgress: fc.constant(0),
    seasonalIntensity: fc.float({ min: f(0.3), max: f(1.0), noNaN: true }),
  }),
  weather: fc.record({
    thermalNeed: fc.float({ min: f(-1.0), max: f(1.0), noNaN: true }),
    vataAggravation: fc.float({ min: f(0), max: f(1), noNaN: true }),
    kaphaAggravation: fc.float({ min: f(0), max: f(1), noNaN: true }),
    pittaAggravation: fc.float({ min: f(0), max: f(1), noNaN: true }),
    tcmWindPattern: fc.constantFrom('none' as const, 'wind_cold' as const, 'wind_heat' as const),
  }),
  organClock: fc.record({
    activeOrgan: fc.constantFrom('stomach', 'spleen', 'heart', 'liver', 'lung', 'kidney'),
    pairedOrgan: fc.constantFrom(
      'spleen',
      'stomach',
      'small_intestine',
      'gallbladder',
      'large_intestine',
      'bladder',
    ),
    element: tcmElementArb,
    isDigestiveWindow: fc.boolean(),
    isWindDownWindow: fc.boolean(),
  }),
  recentFoods: fc.constant([]),
  dietaryRestrictions: fc.constant([]),
  allergies: fc.constant([]),
  explicitDislikes: fc.constant([]),
  today: fc.constant('2026-01-15'),
});

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe('property-based tests', () => {
  const NUM_RUNS = 200;

  it('Property 1: totalScore always in [0, 1.2]', () => {
    fc.assert(
      fc.property(
        foodForScoringArb,
        consistentProfileArb,
        scoringContextArb,
        (food, profile, context) => {
          const result = scoreFood(food, profile, context);
          expect(result.totalScore).toBeGreaterThanOrEqual(0);
          expect(result.totalScore).toBeLessThanOrEqual(1.2);
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  it('Property 2: baseScore always in [0, 1.0]', () => {
    fc.assert(
      fc.property(
        foodForScoringArb,
        consistentProfileArb,
        scoringContextArb,
        (food, profile, context) => {
          const result = scoreFood(food, profile, context);
          expect(result.baseScore).toBeGreaterThanOrEqual(0);
          expect(result.baseScore).toBeLessThanOrEqual(1.0);
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  it('Property 3: determinism -- same inputs produce same outputs', () => {
    fc.assert(
      fc.property(
        foodForScoringArb,
        consistentProfileArb,
        scoringContextArb,
        (food, profile, context) => {
          const a = scoreFood(food, profile, context);
          const b = scoreFood(food, profile, context);
          expect(a.totalScore).toBe(b.totalScore);
          expect(a.baseScore).toBe(b.baseScore);
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  it('Property 4: factor weights sum to 1.0', () => {
    fc.assert(
      fc.property(
        foodForScoringArb,
        consistentProfileArb,
        scoringContextArb,
        (food, profile, context) => {
          const result = scoreFood(food, profile, context);
          const bd = result.breakdown;
          const weightSum =
            bd.constitutional.weight +
            bd.seasonal.weight +
            bd.weather.weight +
            bd.element.weight +
            bd.antiRepetition.weight +
            bd.organClock.weight;
          expect(weightSum).toBeCloseTo(1.0, 10);
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  it('Property 5: credits always length 22', () => {
    fc.assert(
      fc.property(
        foodForScoringArb,
        consistentProfileArb,
        scoringContextArb,
        (food, profile, context) => {
          const result = scoreFood(food, profile, context);
          expect(result.credits.length).toBe(22);
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  it('Property 6: rejected food has 0.0 anti-repetition score', () => {
    fc.assert(
      fc.property(
        foodForScoringArb,
        consistentProfileArb,
        scoringContextArb,
        (food, profile, context) => {
          // Add the food as recently rejected
          const contextWithRejection: ScoringContext = {
            ...context,
            recentFoods: [{ foodId: food.id, date: '2026-01-14', response: 'rejected' }],
          };
          const result = scoreFood(food, profile, contextWithRejection);
          expect(result.breakdown.antiRepetition.rawScore).toBe(0.0);
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  it('Property 7: filterRestrictions removes all matching tags', () => {
    const restrictionArb = fc.array(
      fc.constantFrom('dairy', 'gluten', 'meat', 'soy', 'egg', 'nut'),
      { minLength: 1, maxLength: 3 },
    );

    fc.assert(
      fc.property(
        fc.array(foodForScoringArb, { minLength: 1, maxLength: 20 }),
        restrictionArb,
        (foods, restrictions) => {
          const filtered = filterRestrictions(foods, restrictions);
          const restrictionSet = new Set<string>(restrictions);
          for (const food of filtered) {
            for (const tag of food.tags) {
              expect(restrictionSet.has(tag)).toBe(false);
            }
          }
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  it('Property 8: each factor rawScore in [0, 1]', () => {
    fc.assert(
      fc.property(
        foodForScoringArb,
        consistentProfileArb,
        scoringContextArb,
        (food, profile, context) => {
          const result = scoreFood(food, profile, context);
          const bd = result.breakdown;
          const rawScores = [
            bd.constitutional.rawScore,
            bd.seasonal.rawScore,
            bd.weather.rawScore,
            bd.element.rawScore,
            bd.antiRepetition.rawScore,
            bd.organClock.rawScore,
          ];
          for (const raw of rawScores) {
            expect(raw).toBeGreaterThanOrEqual(0);
            expect(raw).toBeLessThanOrEqual(1);
          }
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  it('Property 9: constitutional fit monotonicity -- more pacifying = higher score', () => {
    fc.assert(
      fc.property(doshaProfileArb, (doshaScores) => {
        // Vata-dominant profile, food A strongly pacifies vata (-2), food B mildly (-1)
        const foodA: FoodAyurveda = {
          vataEffect: -2,
          pittaEffect: 0,
          kaphaEffect: 0,
          rituFit: {
            shishira: 0.5,
            vasanta: 0.5,
            grishma: 0.5,
            varsha: 0.5,
            sharad: 0.5,
            hemanta: 0.5,
          },
        };
        const foodB: FoodAyurveda = {
          vataEffect: -1,
          pittaEffect: 0,
          kaphaEffect: 0,
          rituFit: {
            shishira: 0.5,
            vasanta: 0.5,
            grishma: 0.5,
            varsha: 0.5,
            sharad: 0.5,
            hemanta: 0.5,
          },
        };

        const scoreA = constitutionalFitScore(foodA, doshaScores);
        const scoreB = constitutionalFitScore(foodB, doshaScores);

        // Food A more strongly pacifies vata (negative effect is bigger magnitude)
        // => higher benefit => higher score, regardless of the profile distribution
        expect(scoreA).toBeGreaterThanOrEqual(scoreB);
      }),
      { numRuns: NUM_RUNS },
    );
  });
});
