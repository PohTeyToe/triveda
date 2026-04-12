/**
 * Engine credit source registration.
 *
 * Each deterministic engine registers the features it contributes to.
 * These 7 entries are a subset of the 22-feature registry in credits.ts.
 * IDs match ALL_FEATURE_IDS from the canonical registry.
 */

import type { FeatureId } from '../credits.js';

// ---------------------------------------------------------------------------
// EngineCreditSource type
// ---------------------------------------------------------------------------

/**
 * Metadata describing an engine's contribution to a feature.
 *
 * Distinct from CreditSource (runtime active/contribution tracking).
 * This type is static registration -- which engine powers which feature
 * and when it fires.
 */
export interface EngineCreditSource {
  /** Must match a FeatureId from ALL_FEATURE_IDS */
  id: FeatureId;
  /** Human-readable label */
  label: string;
  /** What this engine contribution does */
  description: string;
  /** Engine directory name that implements this */
  sourceEngine: 'seasonal' | 'organ-clock' | 'weather' | 'constitutional' | 'convergence';
  /** When this engine fires */
  trigger: string;
}

// ---------------------------------------------------------------------------
// 7 engine credit source constants
// ---------------------------------------------------------------------------

export const SEASONAL_MAPPING_CREDIT: EngineCreditSource = {
  id: 'seasonal-ritu',
  label: 'Seasonal Mapping',
  description: 'Ayurvedic Ritu and TCM phase detection based on date and latitude',
  sourceEngine: 'seasonal',
  trigger: 'Every request -- date and location always produce a seasonal context',
};

export const ORGAN_CLOCK_TIMING_CREDIT: EngineCreditSource = {
  id: 'organ-clock',
  label: 'Organ Clock Timing',
  description: 'TCM organ meridian mapping based on time of day',
  sourceEngine: 'organ-clock',
  trigger: 'Every request -- time-dependent organ context',
};

export const WEATHER_ADJUSTMENT_CREDIT: EngineCreditSource = {
  id: 'weather-adaptation',
  label: 'Weather Adjustment',
  description: 'Dosha aggravation and thermal need adjustments from weather data',
  sourceEngine: 'weather',
  trigger: 'When weather data is available',
};

export const DOSHA_ANALYSIS_CREDIT: EngineCreditSource = {
  id: 'dosha-analysis',
  label: 'Dosha Analysis',
  description: 'Constitutional dosha scoring from progressive questionnaire answers',
  sourceEngine: 'constitutional',
  trigger: 'When profile exists (1+ answers)',
};

export const FIVE_ELEMENT_AFFINITY_CREDIT: EngineCreditSource = {
  id: 'five-element',
  label: 'Five Element Affinity',
  description: 'TCM five element scoring from extended questionnaire answers',
  sourceEngine: 'constitutional',
  trigger: 'When 11+ answers are provided',
};

export const CONVERGENCE_DETECTION_CREDIT: EngineCreditSource = {
  id: 'convergence-detection',
  label: 'Convergence Detection',
  description: 'Cross-tradition agreement and divergence scoring for food recommendations',
  sourceEngine: 'convergence',
  trigger: 'Every scored food recommendation',
};

export const PROGRESSIVE_PROFILE_STATE_CREDIT: EngineCreditSource = {
  id: 'progressive-profiling',
  label: 'Progressive Profile',
  description: 'Profile completeness and confidence tracking across questionnaire stages',
  sourceEngine: 'constitutional',
  trigger: 'Profile refinement events (new answers)',
};

// ---------------------------------------------------------------------------
// Aggregate array for iteration
// ---------------------------------------------------------------------------

export const ENGINE_CREDITS: EngineCreditSource[] = [
  SEASONAL_MAPPING_CREDIT,
  ORGAN_CLOCK_TIMING_CREDIT,
  WEATHER_ADJUSTMENT_CREDIT,
  DOSHA_ANALYSIS_CREDIT,
  FIVE_ELEMENT_AFFINITY_CREDIT,
  CONVERGENCE_DETECTION_CREDIT,
  PROGRESSIVE_PROFILE_STATE_CREDIT,
];
