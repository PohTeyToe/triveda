/**
 * Check-in scoring integration.
 *
 * Called by the scoring engine to get dosha adjustments from the daily check-in.
 * The caller provides the answer -- this function does not fetch from the database.
 */

import type { DailyCheckInAnswer, DoshaDelta } from '../inputs/types.js';
import { computeCheckInDelta } from './index.js';

/**
 * Compute dosha adjustments from a daily check-in answer.
 *
 * Returns null if:
 * - answer is null (no check-in today)
 * - answer is dismissed
 * - all selections are null (no chips selected)
 */
export function getCheckInAdjustment(answer: DailyCheckInAnswer | null): DoshaDelta | null {
  if (answer === null) {
    return null;
  }

  if (answer.dismissed) {
    return null;
  }

  // Check if any selection is non-null
  const hasSelection = Object.values(answer.selections).some((v) => v !== null);
  if (!hasSelection) {
    return null;
  }

  return computeCheckInDelta(answer);
}
