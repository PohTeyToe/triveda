/**
 * Stress trigger rule.
 *
 * Fires when 3+ check-ins in 7 days have mood 'poor' or 'bad'.
 * Includes breathwork template rotation in the recommendation.
 */

import type { CreditSource } from '../../credits.js';
import { getBreathworkByRotation } from '../breathwork-templates.js';
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

export function stressRule(state: UserState, now: string): TriggerCandidate | null {
  const mapping = CHIP_TO_FIELD_MAP.find((m) => m.triggerType === 'stress');
  if (!mapping) return null;

  // Check suppression
  if (isSuppressed('stress', state.triggerState, now)) {
    return null;
  }

  // Count matching check-ins
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

  // Compute severity
  const severity = computeSeverity(count, TRIGGER_THRESHOLD, TRIGGER_WEIGHTS.stress);

  // Breathwork rotation based on feedback count
  const stressFeedbackCount = state.triggerFeedbackHistory.filter(
    (f) => f.triggerType === 'stress',
  ).length;
  const breathwork = getBreathworkByRotation(stressFeedbackCount);

  // Build recommendation body
  const bodyPrefix = COPY_TEMPLATES.stress
    .replace('{count}', String(count))
    .replace('{total}', String(total));
  const body = `${bodyPrefix} Here is a 2-minute breathing technique that may help.`;

  // Build credit sources
  const dates = matching.map((ci) => ci.date).join(', ');
  const creditSources: CreditSource[] = [
    {
      featureId: 'check-in-patterns',
      featureName: 'Check-In Patterns',
      active: true,
      contribution: `${count} anxious check-ins in the last ${TRIGGER_WINDOW_DAYS} days (${dates})`,
    },
  ];

  return {
    type: 'stress',
    severity,
    recommendation: {
      title: 'Try a breathing exercise',
      body,
      learnMore: breathwork,
      tradition: 'Ayurvedic pranayama / modern relaxation',
    },
    matchingCheckIns: matching,
    creditSources,
  };
}
