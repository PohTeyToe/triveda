/**
 * Credit emission -- maps 22 backend intelligence features to their
 * contribution in each scoring call.
 *
 * Every ScoredFood includes exactly 22 CreditSource entries,
 * categorized as 'active', 'latent', or 'future'.
 *
 * Pure function, no IO.
 */

import type { CreditSource } from '../credits.js';
import { FACTOR_WEIGHTS } from './factors/constants.js';
import type {
  ConstitutionalProfile,
  Contribution,
  FactorBreakdown,
  FoodForScoring,
  ModifierResult,
  ScoringContext,
} from './types.js';

// ---------------------------------------------------------------------------
// Credit configuration
// ---------------------------------------------------------------------------

interface CreditConfig {
  featureNumber: number;
  id: string;
  label: string;
  getContribution: (
    breakdown: FactorBreakdown,
    modifierResults: ModifierResult[],
    profile: ConstitutionalProfile,
    context: ScoringContext,
  ) => {
    contribution: Contribution;
    weight: number;
    rawScore: number;
    weightedScore: number;
    sourceFactor: string;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findModifier(results: ModifierResult[], name: string): ModifierResult | undefined {
  return results.find((r) => r.name === name);
}

function futureCredit(label: string): {
  contribution: Contribution;
  weight: number;
  rawScore: number;
  weightedScore: number;
  sourceFactor: string;
} {
  return {
    contribution: 'future',
    weight: 0,
    rawScore: 0,
    weightedScore: 0,
    sourceFactor: `${label} (not yet implemented)`,
  };
}

// ---------------------------------------------------------------------------
// CREDIT_MAP -- all 22 features
// ---------------------------------------------------------------------------

const CREDIT_MAP: readonly CreditConfig[] = [
  // #1 Dosha Analysis -- always active (core constitutional factor)
  {
    featureNumber: 1,
    id: 'dosha-analysis',
    label: 'Dosha Analysis',
    getContribution: (breakdown) => ({
      contribution: 'active',
      weight: breakdown.constitutional.weight,
      rawScore: breakdown.constitutional.rawScore,
      weightedScore: breakdown.constitutional.weightedScore,
      sourceFactor: 'constitutional',
    }),
  },

  // #2 Blood Work Interpretation -- active when modifier applied
  {
    featureNumber: 2,
    id: 'blood-work-interpretation',
    label: 'Blood Work Interpretation',
    getContribution: (_breakdown, modifierResults) => {
      const mod = findModifier(modifierResults, 'bloodWork');
      if (mod?.applied) {
        return {
          contribution: 'active',
          weight: 0,
          rawScore: mod.value - 1.0,
          weightedScore: mod.value - 1.0,
          sourceFactor: 'bloodWork modifier',
        };
      }
      return {
        contribution: 'latent',
        weight: 0,
        rawScore: 0,
        weightedScore: 0,
        sourceFactor: 'bloodWork modifier',
      };
    },
  },

  // #3 Meal Plan Logic -- always active (candidate selection)
  {
    featureNumber: 3,
    id: 'meal-plan-logic',
    label: 'Meal Plan Logic',
    getContribution: (breakdown) => ({
      contribution: 'active',
      weight: FACTOR_WEIGHTS.constitutional,
      rawScore: breakdown.constitutional.rawScore,
      weightedScore: breakdown.constitutional.weightedScore,
      sourceFactor: 'candidate-selection',
    }),
  },

  // #4 Symptom Analysis -- active when rejected foods exist
  {
    featureNumber: 4,
    id: 'symptom-analysis',
    label: 'Symptom Analysis',
    getContribution: (breakdown, _modifierResults, _profile, context) => {
      const hasRejected = context.recentFoods.some((f) => f.response === 'rejected');
      return {
        contribution: hasRejected ? 'active' : 'latent',
        weight: breakdown.antiRepetition.weight,
        rawScore: breakdown.antiRepetition.rawScore,
        weightedScore: breakdown.antiRepetition.weightedScore,
        sourceFactor: 'antiRepetition',
      };
    },
  },

  // #5 Journal Sentiment Analysis -- future
  {
    featureNumber: 5,
    id: 'journal-sentiment',
    label: 'Journal Sentiment Analysis',
    getContribution: () => futureCredit('Journal Sentiment Analysis'),
  },

  // #6 Face Scan Data -- active when element scores from scan exist
  {
    featureNumber: 6,
    id: 'face-scan-data',
    label: 'Face Scan Data',
    getContribution: (breakdown, _modifierResults, profile) => ({
      contribution: profile.elementScores !== null ? 'active' : 'latent',
      weight: breakdown.element.weight,
      rawScore: breakdown.element.rawScore,
      weightedScore: breakdown.element.weightedScore,
      sourceFactor: 'element',
    }),
  },

  // #7 Consultation Reasoning -- future
  {
    featureNumber: 7,
    id: 'consultation-reasoning',
    label: 'Consultation Reasoning',
    getContribution: () => futureCredit('Consultation Reasoning'),
  },

  // #8 Wellness Scoring -- always active (normalization)
  {
    featureNumber: 8,
    id: 'wellness-scoring',
    label: 'Wellness Scoring',
    getContribution: (breakdown) => ({
      contribution: 'active',
      weight: FACTOR_WEIGHTS.constitutional,
      rawScore: breakdown.constitutional.rawScore,
      weightedScore: breakdown.constitutional.weightedScore,
      sourceFactor: 'score-normalization',
    }),
  },

  // #9 Notification Triggers -- active during digestive/wind-down windows
  {
    featureNumber: 9,
    id: 'notification-triggers',
    label: 'Notification Triggers',
    getContribution: (breakdown, _modifierResults, _profile, context) => {
      const isActive = context.organClock.isDigestiveWindow || context.organClock.isWindDownWindow;
      return {
        contribution: isActive ? 'active' : 'latent',
        weight: breakdown.organClock.weight,
        rawScore: breakdown.organClock.rawScore,
        weightedScore: breakdown.organClock.weightedScore,
        sourceFactor: 'organClock',
      };
    },
  },

  // #10 Saved Care Patterns -- active when accepted foods in history
  {
    featureNumber: 10,
    id: 'saved-care-patterns',
    label: 'Saved Care Patterns',
    getContribution: (breakdown, _modifierResults, _profile, context) => {
      const hasAccepted = context.recentFoods.some((f) => f.response === 'accepted');
      return {
        contribution: hasAccepted ? 'active' : 'latent',
        weight: breakdown.antiRepetition.weight,
        rawScore: breakdown.antiRepetition.rawScore,
        weightedScore: breakdown.antiRepetition.weightedScore,
        sourceFactor: 'antiRepetition',
      };
    },
  },

  // #11 Gamification Engagement -- future
  {
    featureNumber: 11,
    id: 'gamification-engagement',
    label: 'Gamification Engagement',
    getContribution: () => futureCredit('Gamification Engagement'),
  },

  // #12 Practitioner Matching -- future
  {
    featureNumber: 12,
    id: 'practitioner-matching',
    label: 'Practitioner Matching',
    getContribution: () => futureCredit('Practitioner Matching'),
  },

  // #13 Organ Clock Timing -- always active
  {
    featureNumber: 13,
    id: 'organ-clock-timing',
    label: 'Organ Clock Timing',
    getContribution: (breakdown) => ({
      contribution: 'active',
      weight: breakdown.organClock.weight,
      rawScore: breakdown.organClock.rawScore,
      weightedScore: breakdown.organClock.weightedScore,
      sourceFactor: 'organClock',
    }),
  },

  // #14 Weather Adjustment -- always active
  {
    featureNumber: 14,
    id: 'weather-adjustment',
    label: 'Weather Adjustment',
    getContribution: (breakdown) => ({
      contribution: 'active',
      weight: breakdown.weather.weight,
      rawScore: breakdown.weather.rawScore,
      weightedScore: breakdown.weather.weightedScore,
      sourceFactor: 'weather',
    }),
  },

  // #15 Seasonal Mapping -- always active
  {
    featureNumber: 15,
    id: 'seasonal-mapping',
    label: 'Seasonal Mapping',
    getContribution: (breakdown) => ({
      contribution: 'active',
      weight: breakdown.seasonal.weight,
      rawScore: breakdown.seasonal.rawScore,
      weightedScore: breakdown.seasonal.weightedScore,
      sourceFactor: 'seasonal',
    }),
  },

  // #16 Five Element Affinity -- active when profile has elements
  {
    featureNumber: 16,
    id: 'five-element-affinity',
    label: 'Five Element Affinity',
    getContribution: (breakdown, _modifierResults, profile) => ({
      contribution: profile.primaryElement !== null ? 'active' : 'latent',
      weight: breakdown.element.weight,
      rawScore: breakdown.element.rawScore,
      weightedScore: breakdown.element.weightedScore,
      sourceFactor: 'element',
    }),
  },

  // #17 Anti-Repetition History -- always active
  {
    featureNumber: 17,
    id: 'anti-repetition-history',
    label: 'Anti-Repetition History',
    getContribution: (breakdown) => ({
      contribution: 'active',
      weight: breakdown.antiRepetition.weight,
      rawScore: breakdown.antiRepetition.rawScore,
      weightedScore: breakdown.antiRepetition.weightedScore,
      sourceFactor: 'antiRepetition',
    }),
  },

  // #18 Cultural Food Matching -- active when modifier applied
  {
    featureNumber: 18,
    id: 'cultural-food-matching',
    label: 'Cultural Food Matching',
    getContribution: (_breakdown, modifierResults) => {
      const mod = findModifier(modifierResults, 'culturalMatch');
      if (mod?.applied) {
        return {
          contribution: 'active',
          weight: 0,
          rawScore: mod.value - 1.0,
          weightedScore: mod.value - 1.0,
          sourceFactor: 'culturalMatch modifier',
        };
      }
      return {
        contribution: 'latent',
        weight: 0,
        rawScore: 0,
        weightedScore: 0,
        sourceFactor: 'culturalMatch modifier',
      };
    },
  },

  // #19 Daily Check-In State -- active when modifier applied
  {
    featureNumber: 19,
    id: 'daily-check-in-state',
    label: 'Daily Check-In State',
    getContribution: (_breakdown, modifierResults) => {
      const mod = findModifier(modifierResults, 'dailyCheckIn');
      if (mod?.applied) {
        return {
          contribution: 'active',
          weight: 0,
          rawScore: mod.value - 1.0,
          weightedScore: mod.value - 1.0,
          sourceFactor: 'dailyCheckIn modifier',
        };
      }
      return {
        contribution: 'latent',
        weight: 0,
        rawScore: 0,
        weightedScore: 0,
        sourceFactor: 'dailyCheckIn modifier',
      };
    },
  },

  // #20 Food Feedback History -- active when recent foods exist
  {
    featureNumber: 20,
    id: 'food-feedback-history',
    label: 'Food Feedback History',
    getContribution: (breakdown, _modifierResults, _profile, context) => ({
      contribution: context.recentFoods.length > 0 ? 'active' : 'latent',
      weight: breakdown.antiRepetition.weight,
      rawScore: breakdown.antiRepetition.rawScore,
      weightedScore: breakdown.antiRepetition.weightedScore,
      sourceFactor: 'antiRepetition',
    }),
  },

  // #21 Preference Learning -- future
  {
    featureNumber: 21,
    id: 'preference-learning',
    label: 'Preference Learning',
    getContribution: () => futureCredit('Preference Learning'),
  },

  // #22 Progressive Profile State -- always active
  {
    featureNumber: 22,
    id: 'progressive-profile-state',
    label: 'Progressive Profile State',
    getContribution: (_breakdown, _modifierResults, profile) => ({
      contribution: 'active',
      weight: 0,
      rawScore: profile.completeness,
      weightedScore: 0,
      sourceFactor: 'progressive-profile',
    }),
  },
];

// ---------------------------------------------------------------------------
// emitCredits
// ---------------------------------------------------------------------------

/**
 * Emit 22 CreditSource entries for a scoring run.
 *
 * Each entry maps a backend intelligence feature to its contribution
 * status (active/latent/future), weight, raw score, and source factor.
 *
 * The CreditSource type from the credits module uses featureId, featureName,
 * active (boolean), and contribution (string). We map the richer internal
 * representation to this shape.
 */
export function emitCredits(
  _food: FoodForScoring,
  profile: ConstitutionalProfile,
  context: ScoringContext,
  breakdown: FactorBreakdown,
  modifierResults: ModifierResult[],
): CreditSource[] {
  const credits = new Array<CreditSource>(CREDIT_MAP.length);

  for (let i = 0; i < CREDIT_MAP.length; i++) {
    const config = CREDIT_MAP[i] as CreditConfig; // bounds-checked loop
    const result = config.getContribution(breakdown, modifierResults, profile, context);

    credits[i] = {
      featureId: config.id,
      featureName: config.label,
      active: result.contribution === 'active',
      contribution: buildContributionString(config, result),
    };
  }

  return credits;
}

/**
 * Build a human-readable contribution string for a credit entry.
 */
function buildContributionString(
  config: CreditConfig,
  result: {
    contribution: Contribution;
    weight: number;
    rawScore: number;
    weightedScore: number;
    sourceFactor: string;
  },
): string {
  if (result.contribution === 'future') {
    return `${config.label}: not yet implemented`;
  }

  if (result.contribution === 'latent') {
    return `${config.label}: available but not active (data not provided)`;
  }

  // Active
  if (result.weight > 0) {
    const pct = Math.round(result.rawScore * 100);
    return `${config.label}: ${pct}% score (weight: ${result.weight})`;
  }

  // Modifier or weightless (e.g., profile completeness)
  if (result.rawScore !== 0) {
    const sign = result.rawScore > 0 ? '+' : '';
    return `${config.label}: ${sign}${(result.rawScore * 100).toFixed(0)}% effect`;
  }

  return `${config.label}: active`;
}

/**
 * Get the number of always-active core credits.
 * Useful for tests that verify minimum active count.
 */
export const ALWAYS_ACTIVE_COUNT = 7; // #1, #3, #8, #13, #14, #15, #17
