/**
 * Modifier composition and application.
 *
 * Modifiers are multiplicative adjustments applied after the 6-factor
 * base score. The composite modifier is clamped to [0.8, 1.25].
 *
 * Pure functions, no IO.
 */

import { MODIFIER_CLAMP } from '../factors/constants.js';
import type { ModifierResult, ModifierValues } from '../types.js';

/**
 * Compute the clamped product of modifier values.
 *
 * - Empty array: 1.0 (no modifiers).
 * - Product clamped to [MODIFIER_CLAMP.min, MODIFIER_CLAMP.max].
 *
 * @returns A number in [0.8, 1.25].
 */
export function computeCompositeModifier(values: number[]): number {
  if (values.length === 0) {
    return 1.0;
  }

  const product = values.reduce((acc, v) => acc * v, 1.0);
  return Math.max(MODIFIER_CLAMP.min, Math.min(MODIFIER_CLAMP.max, product));
}

/**
 * Apply all modifiers and produce detailed results.
 *
 * Undefined modifier values are excluded from the composite product
 * and marked as latent (not applied) in the results.
 *
 * @returns composite multiplier and per-modifier detail array.
 */
export function applyModifiers(modifierValues: ModifierValues): {
  composite: number;
  results: ModifierResult[];
} {
  const activeValues: number[] = [];

  if (modifierValues.bloodWork !== undefined) {
    activeValues.push(modifierValues.bloodWork);
  }
  if (modifierValues.culturalMatch !== undefined) {
    activeValues.push(modifierValues.culturalMatch);
  }
  if (modifierValues.dailyCheckIn !== undefined) {
    activeValues.push(modifierValues.dailyCheckIn);
  }

  const composite = computeCompositeModifier(activeValues);

  const results: ModifierResult[] = [
    {
      name: 'bloodWork',
      value: modifierValues.bloodWork ?? 1.0,
      applied: modifierValues.bloodWork !== undefined,
      rationale:
        modifierValues.bloodWork !== undefined
          ? `Blood work modifier: ${modifierValues.bloodWork}x adjustment based on biomarker profile`
          : 'Blood work data not available',
    },
    {
      name: 'culturalMatch',
      value: modifierValues.culturalMatch ?? 1.0,
      applied: modifierValues.culturalMatch !== undefined,
      rationale:
        modifierValues.culturalMatch !== undefined
          ? `Cultural match modifier: ${modifierValues.culturalMatch}x adjustment based on cuisine preferences`
          : 'Cultural match data not available',
    },
    {
      name: 'dailyCheckIn',
      value: modifierValues.dailyCheckIn ?? 1.0,
      applied: modifierValues.dailyCheckIn !== undefined,
      rationale:
        modifierValues.dailyCheckIn !== undefined
          ? `Daily check-in modifier: ${modifierValues.dailyCheckIn}x adjustment based on check-in state`
          : 'Daily check-in data not available',
    },
  ];

  return { composite, results };
}

// Re-export stubs and types
export { bloodWorkModifierStub } from './blood-work.js';
export { culturalMatchModifierStub } from './cultural-match.js';
export { dailyCheckInModifierStub } from './daily-check-in.js';
export type {
  BloodWorkModifierFn,
  CulturalMatchModifierFn,
  DailyCheckInModifierFn,
} from './types.js';
