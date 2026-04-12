/**
 * Severity calculation and ranking for trigger candidates.
 */

import { TRIGGER_WEIGHTS } from './trigger-config.js';
import type { TriggerCandidate } from './types.js';

// ---------------------------------------------------------------------------
// computeSeverity
// ---------------------------------------------------------------------------

/**
 * Compute severity for a trigger.
 * Formula: (count - threshold) * weight
 * Returns 0 if count <= threshold (defensive).
 */
export function computeSeverity(count: number, threshold: number, weight: number): number {
  const delta = count - threshold;
  if (delta <= 0) return 0;
  return delta * weight;
}

// ---------------------------------------------------------------------------
// rankBySeverity
// ---------------------------------------------------------------------------

/**
 * Sort trigger candidates by severity descending.
 *
 * Tie-breaking:
 * 1. Higher TRIGGER_WEIGHTS value wins.
 * 2. Registration order (array index) is stable via Array.sort stability.
 *
 * Returns a new sorted array (does not mutate input).
 */
export function rankBySeverity(candidates: TriggerCandidate[]): TriggerCandidate[] {
  return [...candidates].sort((a, b) => {
    // Primary: severity descending
    const severityDiff = b.severity - a.severity;
    if (severityDiff !== 0) return severityDiff;

    // Tie-breaker: TRIGGER_WEIGHTS descending
    const weightA = TRIGGER_WEIGHTS[a.type];
    const weightB = TRIGGER_WEIGHTS[b.type];
    return weightB - weightA;
  });
}
