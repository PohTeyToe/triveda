/**
 * Face scan scoring integration.
 *
 * Called by the scoring engine to get dosha adjustments from a face scan reading.
 * The caller provides the reading -- this function does not fetch from the database.
 */

import type { DoshaDelta, FaceScanReading } from '../inputs/types.js';

/**
 * Compute dosha adjustments from a face scan reading.
 *
 * Each delta is multiplied by maxWeight (default 0.15) to keep the
 * face scan signal small relative to the constitutional profile.
 *
 * Returns null if no reading is provided.
 */
export function getFaceScanAdjustment(
  reading: FaceScanReading | null,
  maxWeight = 0.15,
): DoshaDelta | null {
  if (reading === null) {
    return null;
  }

  return {
    vata: reading.vata_delta * maxWeight,
    pitta: reading.pitta_delta * maxWeight,
    kapha: reading.kapha_delta * maxWeight,
  };
}
