/**
 * Constitutional fit factor -- Ayurvedic dosha compatibility.
 *
 * A food that pacifies a user's dominant dosha scores high.
 * Foods that aggravate the dominant dosha score low.
 *
 * Pure function, no IO.
 */

import type { DoshaProfile, FoodAyurveda } from '../types.js';

/**
 * Compute constitutional fit score for a food against a dosha profile.
 *
 * Formula:
 *   benefit = (-vataEffect * vata) + (-pittaEffect * pitta) + (-kaphaEffect * kapha)
 *   score = (benefit + 2) / 4
 *
 * The negation inverts the effect: a food with vataEffect = -2 (strongly
 * pacifies Vata) produces a positive contribution for a Vata-dominant user.
 * Normalization maps the raw benefit range [-2, +2] to [0, 1].
 *
 * @returns A number in [0, 1].
 */
export function constitutionalFitScore(
  foodAyurveda: FoodAyurveda,
  doshaProfile: DoshaProfile,
): number {
  const benefit =
    -foodAyurveda.vataEffect * doshaProfile.vata +
    -foodAyurveda.pittaEffect * doshaProfile.pitta +
    -foodAyurveda.kaphaEffect * doshaProfile.kapha;

  return (benefit + 2) / 4;
}
