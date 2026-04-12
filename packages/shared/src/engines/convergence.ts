/**
 * Convergence Detector -- four-dimension cross-tradition agreement analysis.
 *
 * Compares food properties across thermal, constitutional, seasonal, and
 * evidence dimensions to determine whether Ayurveda, TCM, and Naturopathy
 * agree or interestingly disagree on a food recommendation.
 *
 * This enforces the "tongue not brain" principle: the LLM never decides
 * whether traditions agree. Convergence is computed deterministically
 * from structured properties and injected into the LLM synthesis prompt.
 *
 * Pure function: no IO, no side effects.
 */

import type {
  ConstitutionalProfile,
  ConvergenceDebug,
  ConvergenceReport,
  ConvergenceResult,
  DayContext,
  DimensionResult,
  FoodForConvergence,
  TCMElement,
} from './types.js';

// ---------------------------------------------------------------------------
// Weights (equal for now, documented for future tuning)
// ---------------------------------------------------------------------------

const CONVERGENCE_WEIGHTS = {
  thermal: 0.25,
  constitutional: 0.25,
  seasonal: 0.25,
  evidence: 0.25,
} as const;

// ---------------------------------------------------------------------------
// Dimension 1: Thermal Agreement
// ---------------------------------------------------------------------------

/**
 * Compare Ayurvedic virya with TCM thermal nature.
 *
 * Ushna -> warming, sheeta -> cooling.
 * TCM hot/warm -> warming, cool/cold -> cooling, neutral -> neutral.
 * Neutral counts as agreement (no conflict).
 */
export function thermalAgreement(food: FoodForConvergence): DimensionResult {
  const ayurDirection = food.ayurveda.virya === 'ushna' ? 'warming' : 'cooling';

  const tcmNature = food.tcm.thermalNature;
  let tcmDirection: 'warming' | 'cooling' | 'neutral';
  if (tcmNature === 'hot' || tcmNature === 'warm') {
    tcmDirection = 'warming';
  } else if (tcmNature === 'cool' || tcmNature === 'cold') {
    tcmDirection = 'cooling';
  } else {
    tcmDirection = 'neutral';
  }

  if (tcmDirection === 'neutral') {
    return {
      agrees: true,
      detail: `TCM neutral, no conflict (Ayurveda: ${ayurDirection})`,
    };
  }

  if (ayurDirection === tcmDirection) {
    return {
      agrees: true,
      detail: `Both traditions classify as ${ayurDirection}`,
    };
  }

  return {
    agrees: false,
    detail: `Ayurveda: ${ayurDirection}, TCM: ${tcmDirection} -- genuine disagreement`,
  };
}

// ---------------------------------------------------------------------------
// Dimension 2: Constitutional Agreement
// ---------------------------------------------------------------------------

/**
 * Compute dosha fit: how well a food suits the user's dosha profile.
 *
 * For each dosha, the food's effect is negated (negative effect = good for
 * that dosha) and multiplied by the user's dosha proportion.
 * Normalized from [-2, +2] to [0, 1].
 */
function computeDoshaFit(food: FoodForConvergence, profile: ConstitutionalProfile): number {
  const raw =
    -food.ayurveda.vataEffect * profile.doshaScores.vata +
    -food.ayurveda.pittaEffect * profile.doshaScores.pitta +
    -food.ayurveda.kaphaEffect * profile.doshaScores.kapha;
  return (raw + 2) / 4;
}

/**
 * Compute element fit: how well a food's TCM element affinity matches
 * the user's primary and secondary elements.
 *
 * Returns null if the profile has no element scores.
 */
function computeElementFit(
  food: FoodForConvergence,
  profile: ConstitutionalProfile,
): number | null {
  if (
    profile.elementScores === null ||
    profile.primaryElement === null ||
    profile.secondaryElement === null
  ) {
    return null;
  }

  const primaryFit = food.tcm.elementFit[profile.primaryElement] * 0.7;
  const secondaryFit = food.tcm.elementFit[profile.secondaryElement] * 0.3;
  return primaryFit + secondaryFit;
}

/**
 * Constitutional agreement: dosha fit vs element fit.
 *
 * Thresholds: both > 0.6 = agrees (both say good).
 *             both < 0.4 = agrees (both say bad).
 *             one > 0.6, other < 0.4 = disagrees (split signal).
 */
export function constitutionalAgreement(
  food: FoodForConvergence,
  profile: ConstitutionalProfile,
): { result: DimensionResult; doshaFitScore: number; elementFitScore: number } {
  const doshaFit = computeDoshaFit(food, profile);
  const elementFit = computeElementFit(food, profile);

  if (elementFit === null) {
    return {
      result: {
        agrees: true,
        detail: 'Element assessment incomplete, using dosha fit alone',
      },
      doshaFitScore: doshaFit,
      elementFitScore: 0,
    };
  }

  const bothGood = doshaFit > 0.6 && elementFit > 0.6;
  const bothBad = doshaFit < 0.4 && elementFit < 0.4;
  const agrees = bothGood || bothBad;

  if (agrees) {
    const quality = bothGood ? 'suitable' : 'not suitable';
    return {
      result: {
        agrees: true,
        detail: `Both traditions agree: ${quality} (dosha fit ${doshaFit.toFixed(2)}, element fit ${elementFit.toFixed(2)})`,
      },
      doshaFitScore: doshaFit,
      elementFitScore: elementFit,
    };
  }

  return {
    result: {
      agrees: false,
      detail: `Split signal: dosha fit ${doshaFit.toFixed(2)}, element fit ${elementFit.toFixed(2)}`,
    },
    doshaFitScore: doshaFit,
    elementFitScore: elementFit,
  };
}

// ---------------------------------------------------------------------------
// Dimension 3: Seasonal Agreement
// ---------------------------------------------------------------------------

/**
 * Seasonal agreement: Ayurvedic Ritu fit vs TCM element-season match.
 *
 * Ayurvedic fit comes from the food's seasonalFit map for the current Ritu.
 * During sandhi kala (transition), blend current and adjacent Ritu fits.
 *
 * TCM fit is the food's elementFit for the current phase element.
 *
 * Threshold 0.5: both above = agrees, both below = agrees,
 * one above and one below = disagrees.
 */
export function seasonalAgreement(
  food: FoodForConvergence,
  ctx: DayContext,
): { result: DimensionResult; ayurFit: number; tcmFit: number } {
  let ayurFit: number;
  const currentRitu = ctx.seasonal.ayurvedaRitu;

  if (ctx.seasonal.isTransition && ctx.seasonal.adjacentRitu) {
    const progress = ctx.seasonal.transitionProgress;
    const currentFit = food.ayurveda.seasonalFit[currentRitu] ?? 0;
    const adjacentFit = food.ayurveda.seasonalFit[ctx.seasonal.adjacentRitu] ?? 0;
    ayurFit = (1 - progress) * currentFit + progress * adjacentFit;
  } else {
    ayurFit = food.ayurveda.seasonalFit[currentRitu] ?? 0;
  }

  // TCM phase maps directly to an element (same string values)
  const tcmElement = ctx.seasonal.tcmPhase as TCMElement;
  const tcmFit = food.tcm.elementFit[tcmElement] ?? 0;

  const ayurAbove = ayurFit > 0.5;
  const tcmAbove = tcmFit > 0.5;
  const agrees = ayurAbove === tcmAbove;

  if (agrees) {
    const quality = ayurAbove ? 'seasonally appropriate' : 'not ideal for current season';
    return {
      result: {
        agrees: true,
        detail: `Both traditions: ${quality} (Ayurveda ${ayurFit.toFixed(2)}, TCM ${tcmFit.toFixed(2)})`,
      },
      ayurFit,
      tcmFit,
    };
  }

  return {
    result: {
      agrees: false,
      detail: `Seasonal split: Ayurveda ${ayurFit.toFixed(2)}, TCM ${tcmFit.toFixed(2)}`,
    },
    ayurFit,
    tcmFit,
  };
}

// ---------------------------------------------------------------------------
// Dimension 4: Evidence Agreement
// ---------------------------------------------------------------------------

/**
 * Evidence agreement: Naturopathic evidence level vs metabolic affinity.
 *
 * If the profile is incomplete (no metabolic type), return agrees with a
 * note that the evidence dimension is not yet assessable.
 *
 * Otherwise: strong/moderate evidence AND metabolic affinity > 0.5 = agrees.
 * weak/none evidence while traditions endorse = disagrees (honest flag).
 */
export function evidenceAgreement(
  food: FoodForConvergence,
  profile: ConstitutionalProfile,
): { result: DimensionResult; metabolicAffinityScore: number | null } {
  if (profile.metabolicType === null) {
    return {
      result: {
        agrees: true,
        detail: 'Evidence dimension not yet assessable',
      },
      metabolicAffinityScore: null,
    };
  }

  const evidenceLevel = food.naturopathy.evidenceLevel;
  const metabolicAffinity = food.naturopathy.metabolicTypeAffinity[profile.metabolicType];

  const hasEvidence = evidenceLevel === 'strong' || evidenceLevel === 'moderate';
  const affinityGood = metabolicAffinity > 0.5;

  if (hasEvidence && affinityGood) {
    return {
      result: {
        agrees: true,
        detail: `Evidence supports: ${evidenceLevel} evidence, metabolic affinity ${metabolicAffinity.toFixed(2)}`,
      },
      metabolicAffinityScore: metabolicAffinity,
    };
  }

  if (!hasEvidence) {
    return {
      result: {
        agrees: false,
        detail: `No strong evidence: ${evidenceLevel} evidence level -- honest "no evidence for this claim" flag`,
      },
      metabolicAffinityScore: metabolicAffinity,
    };
  }

  // Has evidence but low affinity
  return {
    result: {
      agrees: false,
      detail: `Evidence present but low metabolic affinity (${metabolicAffinity.toFixed(2)}) for ${profile.metabolicType}`,
    },
    metabolicAffinityScore: metabolicAffinity,
  };
}

// ---------------------------------------------------------------------------
// Main: computeConvergence
// ---------------------------------------------------------------------------

/**
 * Compute four-dimension convergence across Ayurveda, TCM, and Naturopathy.
 *
 * Returns a ConvergenceResult with the report (score, agreement count,
 * interesting divergence flag, per-dimension results) and debug info.
 */
export function computeConvergence(
  food: FoodForConvergence,
  profile: ConstitutionalProfile,
  ctx: DayContext,
): ConvergenceResult {
  // Compute all four dimensions
  const thermal = thermalAgreement(food);
  const constitutional = constitutionalAgreement(food, profile);
  const seasonal = seasonalAgreement(food, ctx);
  const evidence = evidenceAgreement(food, profile);

  // Count agreements
  const dimensions = [thermal, constitutional.result, seasonal.result, evidence.result];
  const agreementCount = dimensions.filter((d) => d.agrees).length;

  // Score: agreementCount / 4 (equal weighting)
  const score = agreementCount / Object.keys(CONVERGENCE_WEIGHTS).length;

  // Interesting divergence logic:
  // - Thermal disagrees -> always interesting
  // - Constitutional disagrees AND 2+ others agree -> interesting (mixed signal)
  // - Otherwise -> not interesting
  let interestingDivergence = false;
  if (!thermal.agrees) {
    interestingDivergence = true;
  } else if (!constitutional.result.agrees && agreementCount >= 2) {
    interestingDivergence = true;
  }

  // Build debug object
  const ayurDirection = food.ayurveda.virya === 'ushna' ? 'warming' : 'cooling';
  const tcmNature = food.tcm.thermalNature;
  let tcmDirection: string;
  if (tcmNature === 'hot' || tcmNature === 'warm') {
    tcmDirection = 'warming';
  } else if (tcmNature === 'cool' || tcmNature === 'cold') {
    tcmDirection = 'cooling';
  } else {
    tcmDirection = 'neutral';
  }

  const debug: ConvergenceDebug = {
    doshaFitScore: constitutional.doshaFitScore,
    elementFitScore: constitutional.elementFitScore,
    seasonalFitScoreAyurveda: seasonal.ayurFit,
    seasonalFitScoreTCM: seasonal.tcmFit,
    ayurvedaThermal: ayurDirection,
    tcmThermal: tcmDirection,
    evidenceLevelRaw: food.naturopathy.evidenceLevel,
    metabolicAffinityScore: evidence.metabolicAffinityScore,
  };

  const report: ConvergenceReport = {
    score,
    agreementCount,
    interestingDivergence,
    dimensions: {
      thermal,
      constitutional: constitutional.result,
      seasonal: seasonal.result,
      evidence: evidence.result,
    },
  };

  return { report, debug };
}
