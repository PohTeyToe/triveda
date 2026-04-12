/**
 * Organ clock factor -- TCM organ affinity for the current time period.
 *
 * Scores foods based on direct organ match, paired organ match,
 * or generating cycle (Sheng) element relationship.
 *
 * Pure function, no IO.
 */

import type { FoodTCM, OrganClockContext } from '../types.js';
import { GENERATING_CYCLE, GENERATING_ELEMENT_THRESHOLD } from './constants.js';

/**
 * Check if the food's element affinity feeds the active organ's element
 * via the TCM generating (Sheng) cycle.
 *
 * The generating cycle: water -> wood -> fire -> earth -> metal -> water.
 * A food with high affinity for the "mother" element of the active organ's
 * element is considered supportive.
 */
export function isGeneratingElement(foodTCM: FoodTCM, organClock: OrganClockContext): boolean {
  const motherElement = GENERATING_CYCLE[organClock.element];
  return foodTCM.elementFit[motherElement] > GENERATING_ELEMENT_THRESHOLD;
}

/**
 * Compute organ clock score for a food.
 *
 * - Direct organ affinity match: 1.0
 * - Paired organ match: 0.7
 * - Generating cycle element match: 0.5
 * - No specific affinity: 0.3
 *
 * @returns One of {0.3, 0.5, 0.7, 1.0}.
 */
export function organClockScore(foodTCM: FoodTCM, organClock: OrganClockContext): number {
  if (foodTCM.organAffinity.includes(organClock.activeOrgan)) {
    return 1.0;
  }

  if (foodTCM.organAffinity.includes(organClock.pairedOrgan)) {
    return 0.7;
  }

  if (isGeneratingElement(foodTCM, organClock)) {
    return 0.5;
  }

  return 0.3;
}
