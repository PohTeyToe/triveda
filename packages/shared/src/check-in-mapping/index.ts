/**
 * Daily check-in chip pair definitions and delta computation.
 *
 * Maps the Vikriti concept (transient imbalance) into numeric dosha signals.
 * Each chip pair represents a physical or emotional state associated with
 * specific dosha aggravation or pacification patterns in Ayurvedic practice.
 *
 * Pure TypeScript, no React, no DOM, no side effects.
 */

import type { DailyCheckInAnswer, DoshaDelta } from '../inputs/types.js';
import type { ChipPairDefinition } from './types.js';

/**
 * The 6 fixed chip pairs with Ayurvedic dosha delta mappings.
 *
 * Delta values are small (0.03-0.08) and clamped per-dosha to [-0.1, +0.1]
 * so that the constitutional profile always dominates the transient signal.
 */
export const CHIP_PAIRS: readonly ChipPairDefinition[] = [
  {
    id: 'energy',
    left_label: 'Tired',
    right_label: 'Energetic',
    left_vata_delta: 0.08,
    left_pitta_delta: 0,
    left_kapha_delta: 0,
    right_vata_delta: -0.05,
    right_pitta_delta: 0,
    right_kapha_delta: 0,
    description: 'Fatigue is associated with Vata excess (depleted prana). Energy = Vata pacified.',
  },
  {
    id: 'anxiety',
    left_label: 'Anxious',
    right_label: 'Calm',
    left_vata_delta: 0.06,
    left_pitta_delta: 0.04,
    left_kapha_delta: 0,
    right_vata_delta: -0.04,
    right_pitta_delta: -0.03,
    right_kapha_delta: 0,
    description: 'Anxiety = Vata (mental instability) + Pitta (agitation). Calm = both pacified.',
  },
  {
    id: 'digestion',
    left_label: 'Heavy digestion',
    right_label: 'Light digestion',
    left_vata_delta: 0,
    left_pitta_delta: 0,
    left_kapha_delta: 0.08,
    right_vata_delta: 0.05,
    right_pitta_delta: 0,
    right_kapha_delta: -0.03,
    description: 'Heavy = Kapha excess (sluggish agni). Light = mild Vata with Kapha pacified.',
  },
  {
    id: 'temperature',
    left_label: 'Warm',
    right_label: 'Cold',
    left_vata_delta: 0,
    left_pitta_delta: 0.08,
    left_kapha_delta: 0,
    right_vata_delta: 0.08,
    right_pitta_delta: 0,
    right_kapha_delta: 0,
    description: 'Warmth = Pitta aggravation. Cold = Vata aggravation (poor circulation).',
  },
  {
    id: 'rest',
    left_label: 'Rested',
    right_label: 'Groggy',
    left_vata_delta: -0.03,
    left_pitta_delta: -0.02,
    left_kapha_delta: -0.02,
    right_vata_delta: 0,
    right_pitta_delta: 0,
    right_kapha_delta: 0.07,
    description: 'Rested = all doshas slightly pacified. Groggy = Kapha excess (heaviness, tamas).',
  },
  {
    id: 'appetite',
    left_label: 'Hungry',
    right_label: 'Sated',
    left_vata_delta: 0,
    left_pitta_delta: 0.06,
    left_kapha_delta: 0,
    right_vata_delta: 0,
    right_pitta_delta: 0,
    right_kapha_delta: 0.05,
    description:
      'Hunger = strong agni, Pitta indicator. Satiety = Kapha tendency (contentment/heaviness).',
  },
] as const;

/**
 * Clamp value to [-0.1, +0.1].
 *
 * Even if every chip is selected in the worst-case direction, no single
 * dosha shifts more than 0.1. The constitutional profile always dominates.
 */
function clampDelta(value: number): number {
  return Math.max(-0.1, Math.min(0.1, value));
}

/**
 * Compute the aggregate dosha delta from check-in chip selections.
 *
 * Iterates over all CHIP_PAIRS, accumulates deltas from selected chips,
 * and clamps each dosha to [-0.1, +0.1].
 *
 * Note: this function does NOT check the `dismissed` field. That is
 * handled by getCheckInAdjustment() in scoring.ts. This keeps the
 * computation pure.
 */
export function computeCheckInDelta(answer: DailyCheckInAnswer): DoshaDelta {
  let vata = 0;
  let pitta = 0;
  let kapha = 0;

  for (const pair of CHIP_PAIRS) {
    const selection = answer.selections[pair.id];
    if (selection === 'left') {
      vata += pair.left_vata_delta;
      pitta += pair.left_pitta_delta;
      kapha += pair.left_kapha_delta;
    } else if (selection === 'right') {
      vata += pair.right_vata_delta;
      pitta += pair.right_pitta_delta;
      kapha += pair.right_kapha_delta;
    }
    // null or missing: skip
  }

  return {
    vata: clampDelta(vata),
    pitta: clampDelta(pitta),
    kapha: clampDelta(kapha),
  };
}

// Re-exports
export type { ChipPairDefinition } from './types.js';
export { getCheckInAdjustment } from './scoring.js';
