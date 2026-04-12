/**
 * Digestive trigger rule.
 *
 * Fires when 3+ check-ins in 7 days have digestion 'poor' or 'bad'.
 * Includes dosha-specific tea recommendation.
 */

import type { CreditSource } from '../../credits.js';
import { countMatchingCheckIns } from '../count-matching.js';
import { computeSeverity } from '../severity.js';
import { isSuppressed } from '../suppression.js';
import {
  CHIP_TO_FIELD_MAP,
  COPY_TEMPLATES,
  TRIGGER_THRESHOLD,
  TRIGGER_WEIGHTS,
  TRIGGER_WINDOW_DAYS,
} from '../trigger-config.js';
import type { TriggerCandidate, UserState } from '../types.js';

/**
 * Get dosha-specific tea recommendation based on constitutional profile.
 */
function getTeaRecommendation(state: UserState): string {
  const { vata, pitta, kapha } = state.profile.doshaScores;

  if (vata >= pitta && vata >= kapha) {
    return (
      'Warm ginger tea after meals supports Agni, your digestive fire. ' +
      'Ginger is warming and grounding for Vata constitution.'
    );
  }

  if (kapha >= pitta) {
    return (
      'Cumin-coriander-fennel tea is a classic Ayurvedic digestive blend. ' +
      'Its warming and light qualities help balance Kapha.'
    );
  }

  return (
    'Cumin-coriander-fennel tea is cooling enough for Pitta ' + 'while still supporting digestion.'
  );
}

export function digestiveRule(state: UserState, now: string): TriggerCandidate | null {
  const mapping = CHIP_TO_FIELD_MAP.find((m) => m.triggerType === 'digestive');
  if (!mapping) return null;

  if (isSuppressed('digestive', state.triggerState, now)) {
    return null;
  }

  const { count, total, matching } = countMatchingCheckIns(
    state.recentCheckIns,
    mapping.field,
    mapping.matchValues,
    now,
    TRIGGER_WINDOW_DAYS,
  );

  if (count < TRIGGER_THRESHOLD) {
    return null;
  }

  const severity = computeSeverity(count, TRIGGER_THRESHOLD, TRIGGER_WEIGHTS.digestive);

  const bodyPrefix = COPY_TEMPLATES.digestive
    .replace('{count}', String(count))
    .replace('{total}', String(total));
  const teaRec = getTeaRecommendation(state);
  const body = `${bodyPrefix} ${teaRec} Try walking for 10 minutes after meals.`;

  const dates = matching.map((ci) => ci.date).join(', ');
  const creditSources: CreditSource[] = [
    {
      featureId: 'check-in-patterns',
      featureName: 'Check-In Patterns',
      active: true,
      contribution: `${count} heavy digestion check-ins in the last ${TRIGGER_WINDOW_DAYS} days (${dates})`,
    },
  ];

  return {
    type: 'digestive',
    severity,
    recommendation: {
      title: 'Support your digestion',
      body,
      tradition: 'Ayurveda',
    },
    matchingCheckIns: matching,
    creditSources,
  };
}
