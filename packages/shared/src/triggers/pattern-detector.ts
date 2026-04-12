/*
 * PATTERN DETECTION FRAMEWORK
 *
 * MVP: Counting rules. Each rule counts matching check-ins in a 7-day window.
 * If count >= threshold, the trigger fires.
 *
 * UPGRADE PATH (Phase 2 -- Bayesian Beta-Binomial):
 * Replace counting with Bayesian beta-binomial posteriors.
 * - Prior: Beta(alpha, beta) encoding expected trigger rate per type
 * - Updated with each check-in observation
 * - Posterior mean > threshold replaces counting comparison
 * - Severity = posterior mean (not (count - threshold) * weight)
 * - Credible interval width = confidence metric
 *
 * The UserState -> ActiveTrigger[] interface does NOT change.
 * UI, API, and database schema are unaffected.
 * Only the internals of each rule function change.
 */

import { TRIGGER_RULES } from './rules/index.js';
import { rankBySeverity } from './severity.js';
import { MIN_CHECKINS_FOR_DETECTION } from './trigger-config.js';
import type { ActiveTrigger, TriggerCandidate, UserState } from './types.js';

/**
 * Detect patterns from user check-in history and return active triggers.
 *
 * Pure function: same inputs always produce same outputs.
 * No Date.now(), no Math.random(), no side effects.
 *
 * @param state - User's check-in history, profile, and suppression state
 * @param now - ISO datetime string, passed explicitly to maintain purity
 * @returns ActiveTrigger[] sorted by severity, first has display: true
 */
export function detectPatterns(state: UserState, now: string): ActiveTrigger[] {
  // Guard: need enough data before evaluating rules
  if (state.recentCheckIns.length < MIN_CHECKINS_FOR_DETECTION) {
    return [];
  }

  // Run all rules and collect non-null candidates
  const candidates: TriggerCandidate[] = [];
  for (const rule of TRIGGER_RULES) {
    const result = rule(state, now);
    if (result !== null) {
      candidates.push(result);
    }
  }

  if (candidates.length === 0) {
    return [];
  }

  // Rank by severity
  const ranked = rankBySeverity(candidates);

  // Mark display flag: only the top trigger is displayed
  return ranked.map((candidate, index) => ({
    ...candidate,
    display: index === 0,
  }));
}
