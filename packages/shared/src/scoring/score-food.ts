/**
 * Score composition -- main entry point for the scoring engine.
 *
 * scoreFood scores a single food. scoreCandidates is the batch
 * variant that filters, scores, and sorts an array of foods.
 *
 * Pure functions, no IO.
 */

import { emitCredits } from './credits.js';
import { antiRepetitionScore } from './factors/anti-repetition.js';
import { FACTOR_WEIGHTS, SCORE_CLAMP } from './factors/constants.js';
import { constitutionalFitScore } from './factors/constitutional.js';
import { elementFitScore } from './factors/element.js';
import { organClockScore } from './factors/organ-clock.js';
import { seasonalScore } from './factors/seasonal.js';
import { weatherScore } from './factors/weather.js';
import { filterCandidates } from './filters/index.js';
import { applyModifiers } from './modifiers/index.js';
import type {
  ConstitutionalProfile,
  FactorBreakdown,
  FoodForScoring,
  ModifierResult,
  ModifierValues,
  ScoredFood,
  ScoringContext,
} from './types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function getDominantDosha(profile: ConstitutionalProfile): string {
  const { vata, pitta, kapha } = profile.doshaScores;
  if (vata >= pitta && vata >= kapha) return 'Vata';
  if (pitta >= vata && pitta >= kapha) return 'Pitta';
  return 'Kapha';
}

function describeThermalNeed(thermalNeed: number): string {
  if (thermalNeed > 0.3) return 'warming';
  if (thermalNeed < -0.3) return 'cooling';
  return 'neutral';
}

// ---------------------------------------------------------------------------
// Rationale builders
// ---------------------------------------------------------------------------

function constitutionalRationale(
  rawScore: number,
  dominantDosha: string,
  foodName: string,
): string {
  if (rawScore > 0.6) {
    return `${foodName} supports your ${dominantDosha} constitution`;
  }
  if (rawScore < 0.4) {
    return `${foodName} may aggravate your ${dominantDosha} constitution`;
  }
  return `${foodName} has a neutral effect on your constitution`;
}

function seasonalRationale(rawScore: number, ritu: string): string {
  let fit: string;
  if (rawScore >= 0.7) fit = 'Good';
  else if (rawScore >= 0.4) fit = 'Moderate';
  else fit = 'Poor';
  return `${fit} fit for ${ritu} season`;
}

function weatherRationale(thermalNature: string, thermalNeed: number): string {
  const alignment = thermalNeed > 0 ? 'aligns with' : 'conflicts with';
  const needDesc = describeThermalNeed(thermalNeed);
  return `${thermalNature} food ${alignment} today's ${needDesc} need`;
}

function elementRationale(rawScore: number, primaryElement: string | null): string {
  if (primaryElement === null) {
    return 'Element data not yet available (neutral scoring)';
  }
  const pct = Math.round(rawScore * 100);
  return `Supports your ${primaryElement} element (${pct}%)`;
}

function antiRepetitionRationale(rawScore: number): string {
  if (rawScore === 1.0) return 'Not recently suggested';
  if (rawScore === 0.0) return 'Rejected within 14 days (excluded)';
  return `Last suggested recently (score: ${rawScore.toFixed(1)})`;
}

function organClockRationale(rawScore: number, activeOrgan: string, pairedOrgan: string): string {
  if (rawScore === 1.0) return `${activeOrgan} hour -- direct organ affinity`;
  if (rawScore === 0.7) return `${activeOrgan} hour -- paired organ (${pairedOrgan}) affinity`;
  if (rawScore === 0.5) return `${activeOrgan} hour -- generating element support`;
  return 'No specific affinity for current organ hour';
}

// ---------------------------------------------------------------------------
// scoreFood
// ---------------------------------------------------------------------------

/**
 * Score a single food against a profile and context.
 *
 * Computes 6 weighted factor scores, applies optional modifiers,
 * and emits 22 credit entries.
 */
export function scoreFood(
  food: FoodForScoring,
  profile: ConstitutionalProfile,
  context: ScoringContext,
  modifierValues?: ModifierValues,
): ScoredFood {
  // Step 1: Compute all 6 factor raw scores
  const constitutionalRaw = constitutionalFitScore(food.ayurveda, profile.doshaScores);
  const seasonalRaw = seasonalScore(food.ayurveda, context.seasonal);
  const weatherRaw = weatherScore(food.tcm, context.weather);
  const elementRaw = elementFitScore(food.tcm, profile);
  const antiRepetitionRaw = antiRepetitionScore(food.id, context.recentFoods, context.today);
  const organClockRaw = organClockScore(food.tcm, context.organClock);

  // Step 2: Compute base score (clamped to [0, 1.0])
  const rawBase =
    constitutionalRaw * FACTOR_WEIGHTS.constitutional +
    seasonalRaw * FACTOR_WEIGHTS.seasonal +
    weatherRaw * FACTOR_WEIGHTS.weather +
    elementRaw * FACTOR_WEIGHTS.element +
    antiRepetitionRaw * FACTOR_WEIGHTS.antiRepetition +
    organClockRaw * FACTOR_WEIGHTS.organClock;

  const baseScore = clamp(rawBase, 0, 1.0);

  // Step 3: Apply modifiers
  let totalScore: number;
  let modifierResults: ModifierResult[];

  if (modifierValues !== undefined) {
    const { composite, results } = applyModifiers(modifierValues);
    totalScore = clamp(baseScore * composite, SCORE_CLAMP.min, SCORE_CLAMP.max);
    modifierResults = results;
  } else {
    totalScore = baseScore;
    modifierResults = [
      { name: 'bloodWork', value: 1.0, applied: false, rationale: 'No blood work data provided' },
      {
        name: 'culturalMatch',
        value: 1.0,
        applied: false,
        rationale: 'No cultural preference data provided',
      },
      {
        name: 'dailyCheckIn',
        value: 1.0,
        applied: false,
        rationale: 'No daily check-in data provided',
      },
    ];
  }

  // Step 4: Build FactorBreakdown
  const dominantDosha = getDominantDosha(profile);

  const breakdown: FactorBreakdown = {
    constitutional: {
      weight: FACTOR_WEIGHTS.constitutional,
      rawScore: constitutionalRaw,
      weightedScore: FACTOR_WEIGHTS.constitutional * constitutionalRaw,
      rationale: constitutionalRationale(constitutionalRaw, dominantDosha, food.name),
    },
    seasonal: {
      weight: FACTOR_WEIGHTS.seasonal,
      rawScore: seasonalRaw,
      weightedScore: FACTOR_WEIGHTS.seasonal * seasonalRaw,
      rationale: seasonalRationale(seasonalRaw, context.seasonal.ayurvedaRitu),
    },
    weather: {
      weight: FACTOR_WEIGHTS.weather,
      rawScore: weatherRaw,
      weightedScore: FACTOR_WEIGHTS.weather * weatherRaw,
      rationale: weatherRationale(food.tcm.thermalNature, context.weather.thermalNeed),
    },
    element: {
      weight: FACTOR_WEIGHTS.element,
      rawScore: elementRaw,
      weightedScore: FACTOR_WEIGHTS.element * elementRaw,
      rationale: elementRationale(elementRaw, profile.primaryElement),
    },
    antiRepetition: {
      weight: FACTOR_WEIGHTS.antiRepetition,
      rawScore: antiRepetitionRaw,
      weightedScore: FACTOR_WEIGHTS.antiRepetition * antiRepetitionRaw,
      rationale: antiRepetitionRationale(antiRepetitionRaw),
    },
    organClock: {
      weight: FACTOR_WEIGHTS.organClock,
      rawScore: organClockRaw,
      weightedScore: FACTOR_WEIGHTS.organClock * organClockRaw,
      rationale: organClockRationale(
        organClockRaw,
        context.organClock.activeOrgan,
        context.organClock.pairedOrgan,
      ),
    },
  };

  // Step 5: Emit credits
  const credits = emitCredits(food, profile, context, breakdown, modifierResults);

  // Step 6: Return ScoredFood
  return {
    foodId: food.id,
    foodName: food.name,
    totalScore,
    baseScore,
    breakdown,
    modifiers: modifierResults,
    credits,
  };
}

// ---------------------------------------------------------------------------
// scoreCandidates
// ---------------------------------------------------------------------------

/**
 * Score an array of foods: filter, score each, sort by total score descending.
 *
 * Uses preallocated array and index assignment for performance.
 */
export function scoreCandidates(
  foods: FoodForScoring[],
  profile: ConstitutionalProfile,
  context: ScoringContext,
  modifierValues?: ModifierValues,
): ScoredFood[] {
  // Step 1: Filter
  const eligible = filterCandidates(foods, context);

  if (eligible.length === 0) return [];

  // Step 2: Preallocate and score
  const results = new Array<ScoredFood>(eligible.length);
  for (let i = 0; i < eligible.length; i++) {
    const food = eligible[i] as FoodForScoring; // bounds-checked loop
    results[i] = scoreFood(food, profile, context, modifierValues);
  }

  // Step 3: Sort by totalScore descending, then foodId ascending for ties
  results.sort((a, b) => {
    const diff = b.totalScore - a.totalScore;
    if (diff !== 0) return diff;
    return a.foodId.localeCompare(b.foodId);
  });

  return results;
}
