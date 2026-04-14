/**
 * Daily food orchestration pipeline -- 5-phase composition.
 *
 * Phase 1: Parallel DB reads (profile, feedback, check-in)
 * Phase 2: Parallel engine calls (seasonal, organ clock, weather)
 * Phase 3: Score and select top food
 * Phase 4: LLM narration (blocking or streaming)
 * Phase 5: Compose response
 *
 * Extracted from the route handler for testability.
 */

import {
  constitutionalProfiles,
  culturalCuisines,
  dailyCheckIns,
  foodFeedback,
  foods,
  userProfiles,
} from '@triveda/db';
import type { DbClient } from '@triveda/db';
import type { CreditSource } from '@triveda/shared/src/credits.js';
import { getCuisineLabel } from '@triveda/shared/src/cuisines/index.js';
import { computeCulturalBonus } from '@triveda/shared/src/cultural-config/scoring-integration.js';
import { computeConvergence } from '@triveda/shared/src/engines/convergence.js';
import { getSeasonalContext } from '@triveda/shared/src/engines/index.js';
import type {
  ConstitutionalProfile,
  DayContext,
  OrganClockContext,
  SeasonalContext,
  WeatherContext,
} from '@triveda/shared/src/engines/types.js';
import type {
  DailyFoodInput,
  DailyFoodLLMResult,
  TCMInput,
} from '@triveda/shared/src/llm/types.js';
import {
  filterCandidates,
  scoreCandidates,
  selectTopN,
} from '@triveda/shared/src/scoring/index.js';
import type {
  FoodForScoring,
  ModifierValues,
  ScoredFood,
  ScoringContext,
  FoodFeedback as ScoringFeedback,
} from '@triveda/shared/src/scoring/types.js';
import { and, eq, gte, inArray } from 'drizzle-orm';
import { Temporal } from 'temporal-polyfill';
import { createNonStreamingResponse, createSSEStream } from '../llm/index.js';
import type { SSEOutputEvent } from '../llm/index.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DailyFoodParams {
  userId: string;
  date: string;
  lat: number;
  lon: number;
  requestId: string;
  db: DbClient;
}

export interface DailyFoodResult {
  food: ScoredFood;
  llmResult: DailyFoodLLMResult;
  convergenceReport: ReturnType<typeof computeConvergence>;
  credits: CreditSource[];
  profilingQuestion: string | null;
}

// ---------------------------------------------------------------------------
// Default profiles for new users
// ---------------------------------------------------------------------------

const DEFAULT_PROFILE: ConstitutionalProfile = {
  doshaScores: { vata: 0.333, pitta: 0.333, kapha: 0.334 },
  doshaType: { type: 'tridoshic', primary: 'vata', secondary: 'pitta', tertiary: 'kapha' },
  elementScores: null,
  primaryElement: null,
  secondaryElement: null,
  metabolicType: null,
  ansDominance: null,
  completeness: 0,
  confidence: 0,
  summary: 'No assessment completed yet. Using neutral defaults.',
};

const DEFAULT_WEATHER: WeatherContext = {
  thermalNeed: 0,
  kaphaAggravation: 0,
  vataAggravation: 0,
  pittaAggravation: 0,
  tcmWindPattern: 'none',
};

const DEFAULT_ORGAN_CLOCK: OrganClockContext = {
  activeOrgan: 'stomach',
  pairedOrgan: 'spleen',
  element: 'earth',
  isDigestiveWindow: true,
  isWindDownWindow: false,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toPlainDate(dateStr: string): Temporal.PlainDate {
  return Temporal.PlainDate.from(dateStr);
}

function buildProfile(row: {
  dosha_ratios: unknown;
  element_type: string | null;
  plain_language_summary: string;
  completeness: number | null;
}): ConstitutionalProfile {
  return {
    doshaScores: row.dosha_ratios as ConstitutionalProfile['doshaScores'],
    doshaType: { type: 'single', primary: 'vata', secondary: 'pitta', tertiary: 'kapha' },
    elementScores: null,
    primaryElement: (row.element_type as ConstitutionalProfile['primaryElement']) ?? null,
    secondaryElement: null,
    metabolicType: null,
    ansDominance: null,
    completeness: row.completeness ?? 0,
    confidence: 0,
    summary: row.plain_language_summary ?? '',
  };
}

function mapFoodForScoring(f: {
  id: string;
  name: string;
  category: string;
  contraindications: string[] | null;
  vata_effect: number | null;
  pitta_effect: number | null;
  kapha_effect: number | null;
  ritu_fit: unknown;
  thermal_nature: string | null;
  organ_affinity: string[] | null;
  element_fit: unknown;
}): FoodForScoring {
  return {
    id: f.id,
    name: f.name,
    tags: f.category ? [f.category] : [],
    contraindications: f.contraindications ?? undefined,
    ayurveda: {
      vataEffect: f.vata_effect ?? 0,
      pittaEffect: f.pitta_effect ?? 0,
      kaphaEffect: f.kapha_effect ?? 0,
      rituFit: (f.ritu_fit ?? {}) as FoodForScoring['ayurveda']['rituFit'],
    },
    tcm: {
      thermalNature: (f.thermal_nature ?? 'neutral') as FoodForScoring['tcm']['thermalNature'],
      organAffinity: f.organ_affinity ?? [],
      elementFit: (f.element_fit ?? {}) as FoodForScoring['tcm']['elementFit'],
    },
  };
}

function buildLLMInput(
  requestId: string,
  userId: string,
  selectedFood: ScoredFood,
  foodRow: Record<string, unknown> | undefined,
  profile: ConstitutionalProfile,
  seasonal: SeasonalContext,
  weather: WeatherContext,
  organClock: OrganClockContext,
  recentFoods: ScoringFeedback[],
): DailyFoodInput {
  const rasa = (foodRow?.rasa as string[] | null)?.[0] ?? 'madhura';
  const virya = (foodRow?.virya as string | null) ?? 'sheeta';
  const vipaka = (foodRow?.vipaka as string | null) ?? 'madhura';
  const guna = (foodRow?.guna as string[] | null) ?? [];
  const vataEff = (foodRow?.vata_effect as number | null) ?? 0;
  const pittaEff = (foodRow?.pitta_effect as number | null) ?? 0;
  const kaphaEff = (foodRow?.kapha_effect as number | null) ?? 0;
  const thermalNature = (foodRow?.thermal_nature as string | null) ?? 'neutral';
  const flavor = (foodRow?.flavor as string[] | null) ?? [];
  const organAff = (foodRow?.organ_affinity as string[] | null) ?? [];
  const elementFit = (foodRow?.element_fit as TCMInput['fiveElementScores'] | null) ?? {
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0,
  };
  const glycemicIndex = (foodRow?.glycemic_index as number | null) ?? 50;
  const bioactiveCompounds =
    (foodRow?.bioactive_compounds as Array<{
      name: string;
      amount_per_100g: number;
      unit: string;
    }> | null) ?? [];

  return {
    requestId,
    userId,
    ayurveda: {
      foodProperties: {
        rasa,
        virya,
        vipaka,
        guna,
        doshaEffects: { vata: vataEff, pitta: pittaEff, kapha: kaphaEff },
      },
      doshaProfile: profile.doshaScores,
      seasonalContext: {
        currentRitu: seasonal.ayurvedaRitu,
        sandhiKala: seasonal.isTransition,
      },
      weatherAggravation: {
        vata: weather.vataAggravation,
        pitta: weather.pittaAggravation,
        kapha: weather.kaphaAggravation,
      },
      recentFoodFeedback: recentFoods.map((f) => ({
        foodId: f.foodId,
        accepted: f.response === 'accepted',
        date: f.date,
      })),
      creditSources: selectedFood.credits,
    },
    tcm: {
      foodThermalNature: thermalNature as 'hot' | 'warm' | 'neutral' | 'cool' | 'cold',
      flavors: flavor,
      organAffinities: organAff,
      fiveElementScores: elementFit,
      organClockHour: new Date().getHours(),
      dominantOrgan: organClock.activeOrgan,
      userElementType: profile.elementScores ?? {
        wood: 0.2,
        fire: 0.2,
        earth: 0.2,
        metal: 0.2,
        water: 0.2,
      },
      seasonalTCMPhase: seasonal.tcmPhase,
      creditSources: selectedFood.credits,
    },
    naturopathy: {
      nutritionalData: {
        macros: { protein: 0, carbs: 0, fat: 0, fiber: 0 },
        keyMicronutrients: [],
        glycemicIndex,
      },
      bioactiveCompounds: bioactiveCompounds.map((c) => ({
        name: c.name,
        amount: `${c.amount_per_100g}${c.unit}`,
      })),
      evidenceClaims: [],
      creditSources: selectedFood.credits,
    },
    synthesis: {
      ayurvedaOutput: null,
      tcmOutput: null,
      naturopathyOutput: null,
      convergenceFlag: true,
      convergenceDimensions: {
        thermal: 'neutral',
        constitutional: 'neutral',
        seasonal: 'neutral',
        evidence: 'neutral',
      },
      selectedFoodName: selectedFood.foodName,
      selectedFoodId: selectedFood.foodId,
      creditSources: selectedFood.credits,
    },
  };
}

// ---------------------------------------------------------------------------
// Main orchestration
// ---------------------------------------------------------------------------

export async function composeDailyFood(params: DailyFoodParams): Promise<DailyFoodResult> {
  const { userId, date, lat, requestId, db } = params;

  // ------ Phase 1: Parallel DB reads ------
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [profileRows, feedbackRows, _checkInRows, userProfileRows] = await Promise.all([
    db
      .select()
      .from(constitutionalProfiles)
      .where(eq(constitutionalProfiles.user_id, userId))
      .limit(1),
    db
      .select()
      .from(foodFeedback)
      .where(and(eq(foodFeedback.user_id, userId), gte(foodFeedback.created_at, thirtyDaysAgo))),
    db
      .select()
      .from(dailyCheckIns)
      .where(and(eq(dailyCheckIns.user_id, userId), eq(dailyCheckIns.date, date)))
      .limit(1),
    db.select().from(userProfiles).where(eq(userProfiles.user_id, userId)).limit(1),
  ]);

  const userCuisines = (userProfileRows[0]?.cultural_cuisine_preferences as string[] | null) ?? [];

  const constitutionRow = profileRows[0] ?? null;
  const profile: ConstitutionalProfile = constitutionRow
    ? buildProfile(constitutionRow)
    : DEFAULT_PROFILE;

  const recentFoods: ScoringFeedback[] = feedbackRows.map((row) => ({
    foodId: row.suggestion_id,
    date: row.created_at.toISOString().slice(0, 10),
    response: row.response === 'tried' ? ('accepted' as const) : ('rejected' as const),
  }));

  // ------ Phase 2: Parallel engine calls ------
  const plainDate = toPlainDate(date);
  const seasonalResult = getSeasonalContext(plainDate, lat);

  const seasonal: SeasonalContext = seasonalResult.context;
  const weather: WeatherContext = DEFAULT_WEATHER;
  const organClock: OrganClockContext = DEFAULT_ORGAN_CLOCK;

  // ------ Phase 3: Score and select ------
  const allFoods = await db.select().from(foods);
  const candidates: FoodForScoring[] = allFoods.map(mapFoodForScoring);

  const scoringContext: ScoringContext = {
    seasonal,
    weather,
    organClock,
    recentFoods,
    dietaryRestrictions: [],
    allergies: [],
    explicitDislikes: [],
    today: date,
  };

  const modifiers: ModifierValues = {
    bloodWork: undefined,
    culturalMatch: undefined,
    dailyCheckIn: undefined,
  };

  const filtered = filterCandidates(candidates, scoringContext);
  const scored = scoreCandidates(filtered, profile, scoringContext, modifiers);

  // Cultural bonus: per-food post-score adjustment.
  // cultural_cuisines.prevalence_tag maps to relationship: 'native' | 'common' | 'fusion' | 'none'.
  let culturalMap: Map<string, Array<{ cuisine_code: string; relationship: string }>> = new Map();
  if (userCuisines.length > 0 && scored.length > 0) {
    const candidateIds = scored.map((s) => s.foodId);
    const culturalRows = await db
      .select()
      .from(culturalCuisines)
      .where(
        and(
          eq(culturalCuisines.entity_type, 'food'),
          inArray(culturalCuisines.entity_id, candidateIds),
        ),
      );
    culturalMap = culturalRows.reduce((acc, row) => {
      const key = row.entity_id;
      const arr = acc.get(key) ?? [];
      arr.push({ cuisine_code: row.cuisine, relationship: row.prevalence_tag });
      acc.set(key, arr);
      return acc;
    }, new Map<string, Array<{ cuisine_code: string; relationship: string }>>());
  }

  const scoredWithCultural = scored
    .map((s) => {
      const foodCuisines = culturalMap.get(s.foodId) ?? [];
      const { bonus, matchedCuisines } = computeCulturalBonus(userCuisines, foodCuisines);
      const boosted = Math.min(1, s.totalScore + bonus);
      return { ...s, totalScore: boosted, culturalBonus: bonus, matchedCuisines };
    })
    .sort((a, b) => {
      const diff = b.totalScore - a.totalScore;
      return diff !== 0 ? diff : a.foodId.localeCompare(b.foodId);
    });

  const topN = scoredWithCultural.slice(0, 1);

  if (topN.length === 0) {
    throw new Error('No foods available after filtering');
  }

  const selectedFood = topN[0];
  if (!selectedFood) {
    throw new Error('No foods available after filtering');
  }
  const selectedFoodRow = allFoods.find((f) => f.id === selectedFood.foodId);

  // Append cultural match credit to the selected food's credits
  if (selectedFood.culturalBonus > 0 && selectedFood.matchedCuisines.length > 0) {
    const labels = selectedFood.matchedCuisines.map(getCuisineLabel).join(', ');
    selectedFood.credits.push({
      featureId: 'cultural-match',
      featureName: 'Cultural Match',
      active: true,
      contribution: `Nudged by ${labels} cuisine preference (+${selectedFood.culturalBonus.toFixed(2)})`,
    });
  }

  // Convergence
  const convergenceInput = {
    ayurveda: {
      virya: (selectedFoodRow?.virya ?? 'sheeta') as 'ushna' | 'sheeta',
      vataEffect: selectedFoodRow?.vata_effect ?? 0,
      pittaEffect: selectedFoodRow?.pitta_effect ?? 0,
      kaphaEffect: selectedFoodRow?.kapha_effect ?? 0,
      seasonalFit: (selectedFoodRow?.ritu_fit ?? {}) as Record<string, number>,
    },
    tcm: {
      thermalNature: (selectedFoodRow?.thermal_nature ?? 'neutral') as
        | 'hot'
        | 'warm'
        | 'neutral'
        | 'cool'
        | 'cold',
      elementFit: (selectedFoodRow?.element_fit ?? {}) as Record<string, number>,
    },
    naturopathy: {
      evidenceLevel: 'moderate' as const,
      metabolicTypeAffinity: { fast_oxidizer: 0.5, slow_oxidizer: 0.5, mixed_oxidizer: 0.5 },
    },
  };

  const dayContext: DayContext = { seasonal, weather, organClock };
  const convergenceResult = computeConvergence(convergenceInput, profile, dayContext);

  // ------ Phase 4: LLM narration ------
  const llmInput = buildLLMInput(
    requestId,
    userId,
    selectedFood,
    selectedFoodRow as Record<string, unknown> | undefined,
    profile,
    seasonal,
    weather,
    organClock,
    recentFoods,
  );
  const llmResult = await createNonStreamingResponse(llmInput);

  // ------ Phase 5: Compose ------
  const profilingQuestion =
    profile.completeness < 100
      ? 'Continue your constitutional assessment to get more personalized recommendations.'
      : null;

  return {
    food: selectedFood,
    llmResult,
    convergenceReport: convergenceResult,
    credits: selectedFood.credits,
    profilingQuestion,
  };
}

/**
 * Create an SSE stream for the daily food pipeline.
 * Emits food_selected first, then LLM tradition events, then done.
 */
export async function* composeDailyFoodSSE(
  params: DailyFoodParams,
  signal?: AbortSignal,
): AsyncGenerator<SSEOutputEvent | { event: 'food_selected'; data: Record<string, unknown> }> {
  const { userId, date, lat, requestId, db } = params;

  // Phases 1-3 are identical to blocking mode
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [profileRows, feedbackRows] = await Promise.all([
    db
      .select()
      .from(constitutionalProfiles)
      .where(eq(constitutionalProfiles.user_id, userId))
      .limit(1),
    db
      .select()
      .from(foodFeedback)
      .where(and(eq(foodFeedback.user_id, userId), gte(foodFeedback.created_at, thirtyDaysAgo))),
  ]);

  const constitutionRow = profileRows[0] ?? null;
  const profile: ConstitutionalProfile = constitutionRow
    ? buildProfile(constitutionRow)
    : DEFAULT_PROFILE;

  const recentFoods: ScoringFeedback[] = feedbackRows.map((row) => ({
    foodId: row.suggestion_id,
    date: row.created_at.toISOString().slice(0, 10),
    response: row.response === 'tried' ? ('accepted' as const) : ('rejected' as const),
  }));

  const plainDate = toPlainDate(date);
  const seasonalResult = getSeasonalContext(plainDate, lat);
  const seasonal: SeasonalContext = seasonalResult.context;
  const weather: WeatherContext = DEFAULT_WEATHER;
  const organClock: OrganClockContext = DEFAULT_ORGAN_CLOCK;

  const allFoods = await db.select().from(foods);
  const candidates: FoodForScoring[] = allFoods.map(mapFoodForScoring);

  const scoringContext: ScoringContext = {
    seasonal,
    weather,
    organClock,
    recentFoods,
    dietaryRestrictions: [],
    allergies: [],
    explicitDislikes: [],
    today: date,
  };

  const modifiers: ModifierValues = {
    bloodWork: undefined,
    culturalMatch: undefined,
    dailyCheckIn: undefined,
  };

  const filtered = filterCandidates(candidates, scoringContext);
  const scored = scoreCandidates(filtered, profile, scoringContext, modifiers);
  const topN = selectTopN(scored, 1);

  if (topN.length === 0) {
    throw new Error('No foods available after filtering');
  }

  const selectedFood = topN[0];
  if (!selectedFood) {
    throw new Error('No foods available after filtering');
  }
  const selectedFoodRow = allFoods.find((f) => f.id === selectedFood.foodId);

  const profilingQuestion =
    profile.completeness < 100
      ? 'Continue your constitutional assessment to get more personalized recommendations.'
      : null;

  // Build convergence stub (full convergence requires LLM output)
  const convergenceStub = {
    state: 'converged' as const,
    dimensions: [
      { name: 'thermal', agrees: true },
      { name: 'taste', agrees: true },
      { name: 'season', agrees: true },
    ],
  };

  // Emit food_selected immediately (before LLM)
  yield {
    event: 'food_selected' as const,
    data: {
      food: {
        id: selectedFood.foodId,
        name: selectedFood.foodName,
        properties: {
          thermal: selectedFoodRow?.thermal_nature ?? undefined,
          taste: selectedFoodRow?.primary_rasa ?? undefined,
          season: seasonal.ayurvedaRitu ?? undefined,
        },
      },
      rationale:
        selectedFood.breakdown?.constitutional?.rationale ??
        'Selected based on your constitutional profile.',
      convergence: convergenceStub,
      credits: selectedFood.credits,
      profilingQuestion,
      seasonLabel: seasonal.ayurvedaRitu ?? 'vasanta',
      weatherSummary: 'Clear skies',
      date,
      suggestionId: selectedFood.foodId,
      feedback: null,
    },
  };

  if (signal?.aborted) return;

  // Build LLM input and stream
  const llmInput = buildLLMInput(
    requestId,
    userId,
    selectedFood,
    selectedFoodRow as Record<string, unknown> | undefined,
    profile,
    seasonal,
    weather,
    organClock,
    recentFoods,
  );

  const sseStream = createSSEStream(llmInput, { signal });
  for await (const event of sseStream) {
    if (signal?.aborted) return;
    yield event;
  }
}
