/**
 * Energy trigger rule.
 *
 * Fires when 3+ check-ins in 7 days have energy 'low'.
 * Includes a food bias toward ojas-building foods.
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

export function energyRule(state: UserState, now: string): TriggerCandidate | null {
  const mapping = CHIP_TO_FIELD_MAP.find((m) => m.triggerType === 'energy');
  if (!mapping) return null;

  if (isSuppressed('energy', state.triggerState, now)) {
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

  const severity = computeSeverity(count, TRIGGER_THRESHOLD, TRIGGER_WEIGHTS.energy);

  const bodyPrefix = COPY_TEMPLATES.energy
    .replace('{count}', String(count))
    .replace('{total}', String(total));
  const body = `${bodyPrefix} Morning sunlight within 30 minutes of waking helps reset your circadian rhythm.`;

  const dates = matching.map((ci) => ci.date).join(', ');
  const creditSources: CreditSource[] = [
    {
      featureId: 'check-in-patterns',
      featureName: 'Check-In Patterns',
      active: true,
      contribution: `${count} low energy check-ins in the last ${TRIGGER_WINDOW_DAYS} days (${dates})`,
    },
    {
      featureId: 'food-feedback-loop',
      featureName: 'Food Feedback Loop',
      active: true,
      contribution: 'Nudged toward ojas-building foods based on your recent low-energy check-ins.',
    },
  ];

  return {
    type: 'energy',
    severity,
    recommendation: {
      title: 'Boost your energy naturally',
      body,
      tradition: 'Naturopathy / chronobiology',
    },
    matchingCheckIns: matching,
    creditSources,
    foodBias: {
      tag: 'ojas_building',
      multiplier: 1.1,
      expiresAfterDays: 1,
    },
  };
}
