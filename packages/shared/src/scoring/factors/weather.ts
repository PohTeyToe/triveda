/**
 * Weather factor -- thermal nature alignment with current weather.
 *
 * Maps food thermal nature to a numeric value and computes alignment
 * with the body's thermal need derived from weather conditions.
 *
 * Pure function, no IO.
 */

import type { FoodTCM, WeatherContext } from '../types.js';
import { THERMAL_VALUES } from './constants.js';

/**
 * Compute weather alignment score for a food's thermal nature.
 *
 * Formula:
 *   foodThermal = THERMAL_VALUES[food.thermalNature]
 *   alignment = 1.0 - abs(thermalNeed - foodThermal) / 2.0
 *
 * Produces 1.0 when food thermal exactly matches the body's need,
 * and 0.0 when maximally opposed.
 *
 * @returns A number in [0, 1].
 */
export function weatherScore(foodTCM: FoodTCM, weather: WeatherContext): number {
  const foodThermal = THERMAL_VALUES[foodTCM.thermalNature];
  return 1.0 - Math.abs(weather.thermalNeed - foodThermal) / 2.0;
}
