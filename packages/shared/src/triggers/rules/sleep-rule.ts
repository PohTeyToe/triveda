/**
 * Sleep trigger rule.
 *
 * Fires when 3+ check-ins in 7 days have sleepQuality 'groggy'.
 * Check-ins without a sleepQuality value are excluded from both count and total.
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

export function sleepRule(state: UserState, now: string): TriggerCandidate | null {
  const mapping = CHIP_TO_FIELD_MAP.find((m) => m.triggerType === 'sleep');
  if (!mapping) return null;

  if (isSuppressed('sleep', state.triggerState, now)) {
    return null;
  }

  const { count, total, matching } = countMatchingCheckIns(
    state.recentCheckIns,
    mapping.field,
    mapping.matchValues,
    now,
    TRIGGER_WINDOW_DAYS,
    'sleep',
  );

  if (count < TRIGGER_THRESHOLD) {
    return null;
  }

  const severity = computeSeverity(count, TRIGGER_THRESHOLD, TRIGGER_WEIGHTS.sleep);

  const bodyPrefix = COPY_TEMPLATES.sleep
    .replace('{count}', String(count))
    .replace('{total}', String(total));
  const body = `${bodyPrefix} An evening wind-down routine supports restful sleep. Try warm oil self-massage (abhyanga) before bed. Reduce screen time after 9 PM. Eat dinner before 7 PM when possible.`;

  const dates = matching.map((ci) => ci.date).join(', ');
  const creditSources: CreditSource[] = [
    {
      featureId: 'check-in-patterns',
      featureName: 'Check-In Patterns',
      active: true,
      contribution: `${count} restless sleep check-ins in the last ${TRIGGER_WINDOW_DAYS} days (${dates})`,
    },
  ];

  return {
    type: 'sleep',
    severity,
    recommendation: {
      title: 'Improve your sleep quality',
      body,
      tradition: 'Ayurveda (Kapha-balancing evening practices)',
    },
    matchingCheckIns: matching,
    creditSources,
  };
}
