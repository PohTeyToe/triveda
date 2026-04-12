/**
 * Trigger configuration constants.
 *
 * All numeric parameters for the trigger system live here.
 * No magic numbers in rule functions.
 */

import type { ChipFieldMapping, TriggerType } from './types.js';

// ---------------------------------------------------------------------------
// Detection thresholds
// ---------------------------------------------------------------------------

/** Minimum total check-ins before any rule is evaluated */
export const MIN_CHECKINS_FOR_DETECTION = 5;

/** Number of days in the counting window */
export const TRIGGER_WINDOW_DAYS = 7;

/** Number of matching check-ins required to fire a trigger */
export const TRIGGER_THRESHOLD = 3;

// ---------------------------------------------------------------------------
// Severity weights (per trigger type)
// ---------------------------------------------------------------------------

export const TRIGGER_WEIGHTS: Record<TriggerType, number> = {
  sleep: 1.0,
  energy: 0.9,
  stress: 0.8,
  digestive: 0.7,
};

// ---------------------------------------------------------------------------
// Suppression durations (in days)
// ---------------------------------------------------------------------------

export const SUPPRESSION_DURATIONS = {
  got_it: 0, // no suppression, can re-fire
  remind_me: 7, // days
  not_interested: 30, // days
} as const;

// ---------------------------------------------------------------------------
// Chip-to-field mapping
// ---------------------------------------------------------------------------

export const CHIP_TO_FIELD_MAP: ChipFieldMapping[] = [
  { field: 'mood', matchValues: ['poor', 'bad'], triggerType: 'stress' },
  { field: 'energy', matchValues: ['low'], triggerType: 'energy' },
  { field: 'digestion', matchValues: ['poor', 'bad'], triggerType: 'digestive' },
  { field: 'sleepQuality', matchValues: ['groggy'], triggerType: 'sleep' },
];

// ---------------------------------------------------------------------------
// Copy templates
// ---------------------------------------------------------------------------

export const COPY_TEMPLATES: Record<TriggerType, string> = {
  stress: 'We noticed you felt anxious {count} of the last {total} days.',
  digestive: 'We noticed heavy digestion {count} of the last {total} days.',
  energy: 'We noticed low energy {count} of the last {total} days.',
  sleep: 'We noticed restless sleep {count} of the last {total} days.',
};

// ---------------------------------------------------------------------------
// Honest copy deny list
// ---------------------------------------------------------------------------

export const COPY_DENY_LIST = [
  'AI detected',
  'our algorithm',
  'machine learning',
  'our model',
  'artificial intelligence',
  'neural network',
  'deep learning',
  'predicted',
  'our system analyzed',
];

// ---------------------------------------------------------------------------
// Breathwork rotation
// ---------------------------------------------------------------------------

export const BREATHWORK_ROTATION_ORDER = [
  'four-seven-eight',
  'nadi-shodhana',
  'box-breathing',
] as const;
