/**
 * Weekly herb scoring configuration.
 *
 * Herb-specific weights, anti-repetition decay, and the herbToScoringInput()
 * adapter that maps flat herb DB columns to FoodForScoring shape.
 *
 * IMPORTANT (Amendment 003): The herbs table uses flat columns for Ayurveda
 * and TCM properties (vata_effect, pitta_effect, etc.), NOT JSONB columns.
 * The adapter assembles nested objects from these flat columns.
 */

import type { Ritu } from '../engines/types.js';
import type { FoodForScoring } from '../scoring/types.js';

/**
 * Shape of a herb row from the database.
 * Defined locally to avoid importing @triveda/db into shared
 * (shared must remain pure -- no DB dependencies).
 */
export interface HerbRow {
  id: string;
  name: string;
  herb_actions: string[];
  contraindications: string[] | null;
  // Ayurveda flat columns
  vata_effect: number;
  pitta_effect: number;
  kapha_effect: number;
  ritu_fit: Record<Ritu, number>;
  // TCM flat columns
  thermal_nature: string;
  organ_affinity: string[];
  element_fit: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Herb-specific factor weights (sum to 1.0)
// ---------------------------------------------------------------------------

export const HERB_WEIGHTS = {
  constitutional: 0.35,
  seasonal: 0.25,
  weather: 0.1,
  element: 0.1,
  antiRepetition: 0.15,
  organClock: 0.05,
} as const;

// ---------------------------------------------------------------------------
// Anti-repetition decay for 4-week window
// ---------------------------------------------------------------------------

export interface HerbDecayStep {
  readonly maxWeeksAgo: number;
  readonly score: number;
}

export const HERB_DECAY_STEPS: readonly HerbDecayStep[] = [
  { maxWeeksAgo: 0, score: 0.0 }, // same herb this week
  { maxWeeksAgo: 2, score: 0.2 }, // 1-2 weeks ago
  { maxWeeksAgo: 3, score: 0.5 }, // 2-3 weeks ago
  { maxWeeksAgo: 4, score: 0.8 }, // 3-4 weeks ago
  { maxWeeksAgo: Number.POSITIVE_INFINITY, score: 1.0 }, // over 4 weeks
] as const;

// ---------------------------------------------------------------------------
// Delivery day
// ---------------------------------------------------------------------------

/** Default delivery day: Sunday (0=Sun, 1=Mon, ..., 6=Sat) */
export const DEFAULT_DELIVERY_DAY = 0;

// ---------------------------------------------------------------------------
// Herb feedback type
// ---------------------------------------------------------------------------

export interface HerbFeedback {
  herbId: string;
  isoYear: number;
  isoWeek: number;
  feedbackType: 'tried' | 'helpful' | 'not_for_me' | 'remind_next_week';
}

// ---------------------------------------------------------------------------
// herbToScoringInput -- flat column adapter (Amendment 003)
// ---------------------------------------------------------------------------

/**
 * Transform a herb database row (flat columns) into FoodForScoring shape.
 *
 * The herbs table shares ayurvedaColumns and tcmColumns with the foods table.
 * Both use flat columns: vata_effect (smallint), pitta_effect (smallint), etc.
 * This adapter assembles the nested ayurveda/tcm objects the scoring engine expects.
 */
export function herbToScoringInput(herb: HerbRow): FoodForScoring {
  return {
    id: herb.id,
    name: herb.name,
    tags: herb.herb_actions ?? [],
    contraindications: herb.contraindications ?? undefined,
    ayurveda: {
      vataEffect: herb.vata_effect,
      pittaEffect: herb.pitta_effect,
      kaphaEffect: herb.kapha_effect,
      rituFit: herb.ritu_fit,
    },
    tcm: {
      thermalNature: herb.thermal_nature as FoodForScoring['tcm']['thermalNature'],
      organAffinity: herb.organ_affinity,
      elementFit: herb.element_fit,
    },
  };
}
