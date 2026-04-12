/**
 * Explain -- transforms a ScoredFood into a detailed ScoreBreakdown
 * with signed attribution per factor and enhanced rationale strings.
 *
 * Consumed by the backend's /debug/score endpoint (gated behind
 * TRIVEDA_DEBUG=true) and the frontend's debug panel.
 *
 * Pure function, no IO.
 */

import type { ConstitutionalProfile, ScoreBreakdown, ScoredFood, ScoringContext } from './types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDominantDosha(profile: ConstitutionalProfile): { name: string; pct: number } {
  const { vata, pitta, kapha } = profile.doshaScores;
  if (vata >= pitta && vata >= kapha) return { name: 'Vata', pct: Math.round(vata * 100) };
  if (pitta >= vata && pitta >= kapha) return { name: 'Pitta', pct: Math.round(pitta * 100) };
  return { name: 'Kapha', pct: Math.round(kapha * 100) };
}

function describeThermalNeed(thermalNeed: number): string {
  if (thermalNeed > 0.3) return 'warming';
  if (thermalNeed < -0.3) return 'cooling';
  return 'neutral';
}

// ---------------------------------------------------------------------------
// Rationale builders (enhanced with profile-aware context)
// ---------------------------------------------------------------------------

function constitutionalRationale(
  foodName: string,
  rawScore: number,
  profile: ConstitutionalProfile,
): string {
  const dominant = getDominantDosha(profile);
  if (rawScore > 0.6) {
    return `${foodName} supports your ${dominant.name} constitution (dominant at ${dominant.pct}%)`;
  }
  if (rawScore < 0.4) {
    return `${foodName} may challenge your ${dominant.name} constitution`;
  }
  return `${foodName} has a neutral effect on your ${dominant.name} constitution`;
}

function seasonalRationale(rawScore: number, context: ScoringContext): string {
  let fit: string;
  if (rawScore >= 0.7) fit = 'Good';
  else if (rawScore >= 0.4) fit = 'Moderate';
  else fit = 'Poor';

  let result = `${fit} fit for ${context.seasonal.ayurvedaRitu} season (score: ${rawScore.toFixed(2)})`;

  if (context.seasonal.isTransition && context.seasonal.adjacentRitu) {
    result += ` (currently transitioning to ${context.seasonal.adjacentRitu})`;
  }

  return result;
}

function weatherRationale(thermalNature: string, rawScore: number, thermalNeed: number): string {
  const needDesc = describeThermalNeed(thermalNeed);
  const alignment = rawScore >= 0.7 ? 'aligns with' : 'conflicts with';
  return `${thermalNature} food ${alignment} today's ${needDesc} need (alignment: ${rawScore.toFixed(2)})`;
}

function elementRationale(rawScore: number, profile: ConstitutionalProfile): string {
  if (profile.primaryElement !== null) {
    const pct = Math.round(rawScore * 100);
    return `Supports your ${profile.primaryElement} element (${pct}% affinity)`;
  }
  return 'Element data not yet available (neutral scoring)';
}

function antiRepetitionRationale(rawScore: number): string {
  if (rawScore === 1.0) return 'Not recently suggested';
  if (rawScore === 0.0) return 'Rejected within 14 days (excluded from ranking)';
  if (rawScore <= 0.1) return 'Suggested yesterday';
  if (rawScore <= 0.4) return 'Suggested within 3 days';
  if (rawScore <= 0.7) return 'Suggested within the last week';
  return 'Not recently suggested';
}

function organClockRationale(rawScore: number, context: ScoringContext): string {
  const activeOrgan = context.organClock.activeOrgan;
  const pairedOrgan = context.organClock.pairedOrgan;

  if (rawScore === 1.0) return `${activeOrgan} hour -- direct organ match`;
  if (rawScore === 0.7) return `${activeOrgan} hour -- paired organ (${pairedOrgan}) support`;
  if (rawScore === 0.5) return `Generating element support for ${activeOrgan}`;
  return `No specific affinity for ${activeOrgan} hour`;
}

// ---------------------------------------------------------------------------
// explainScore
// ---------------------------------------------------------------------------

/**
 * Transform a ScoredFood into a detailed ScoreBreakdown with signed
 * attribution and enhanced rationale strings.
 *
 * Attribution formula: weight * (rawScore - 0.5)
 * - Positive: factor pushed the score above neutral (helped)
 * - Negative: factor pushed below neutral (hurt)
 * - Zero: neutral (no effect)
 */
export function explainScore(
  scoredFood: ScoredFood,
  profile: ConstitutionalProfile,
  context: ScoringContext,
): ScoreBreakdown {
  const bd = scoredFood.breakdown;

  const factors = [
    {
      name: 'Constitutional Fit',
      weight: bd.constitutional.weight,
      rawScore: bd.constitutional.rawScore,
      weightedScore: bd.constitutional.weightedScore,
      attribution: bd.constitutional.weight * (bd.constitutional.rawScore - 0.5),
      rationale: constitutionalRationale(scoredFood.foodName, bd.constitutional.rawScore, profile),
    },
    {
      name: 'Seasonal Fit',
      weight: bd.seasonal.weight,
      rawScore: bd.seasonal.rawScore,
      weightedScore: bd.seasonal.weightedScore,
      attribution: bd.seasonal.weight * (bd.seasonal.rawScore - 0.5),
      rationale: seasonalRationale(bd.seasonal.rawScore, context),
    },
    {
      name: 'Weather Alignment',
      weight: bd.weather.weight,
      rawScore: bd.weather.rawScore,
      weightedScore: bd.weather.weightedScore,
      attribution: bd.weather.weight * (bd.weather.rawScore - 0.5),
      rationale: weatherRationale(
        context.weather.thermalNeed > 0 ? 'warm' : 'cool',
        bd.weather.rawScore,
        context.weather.thermalNeed,
      ),
    },
    {
      name: 'Element Affinity',
      weight: bd.element.weight,
      rawScore: bd.element.rawScore,
      weightedScore: bd.element.weightedScore,
      attribution: bd.element.weight * (bd.element.rawScore - 0.5),
      rationale: elementRationale(bd.element.rawScore, profile),
    },
    {
      name: 'Anti-Repetition',
      weight: bd.antiRepetition.weight,
      rawScore: bd.antiRepetition.rawScore,
      weightedScore: bd.antiRepetition.weightedScore,
      attribution: bd.antiRepetition.weight * (bd.antiRepetition.rawScore - 0.5),
      rationale: antiRepetitionRationale(bd.antiRepetition.rawScore),
    },
    {
      name: 'Organ Clock',
      weight: bd.organClock.weight,
      rawScore: bd.organClock.rawScore,
      weightedScore: bd.organClock.weightedScore,
      attribution: bd.organClock.weight * (bd.organClock.rawScore - 0.5),
      rationale: organClockRationale(bd.organClock.rawScore, context),
    },
  ];

  const modifiers = scoredFood.modifiers.map((m) => ({
    name: m.name,
    value: m.value,
    applied: m.applied,
    rationale: m.rationale,
  }));

  return {
    foodId: scoredFood.foodId,
    foodName: scoredFood.foodName,
    totalScore: scoredFood.totalScore,
    baseScore: scoredFood.baseScore,
    factors,
    modifiers,
    credits: scoredFood.credits,
  };
}
