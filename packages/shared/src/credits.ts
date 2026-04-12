/**
 * Credit system for the 22-feature backend intelligence.
 *
 * Each feature has a unique ID, human-readable label, feature number,
 * and tracks whether it was active in a given response plus an optional
 * contribution description.
 */

// ---------------------------------------------------------------------------
// Canonical feature registry
// ---------------------------------------------------------------------------

export const ALL_FEATURE_IDS = [
  { id: 'dosha-analysis', label: 'Dosha Analysis', featureNumber: 1 },
  { id: 'rasa-mapping', label: 'Rasa Mapping', featureNumber: 2 },
  { id: 'virya-vipaka', label: 'Virya & Vipaka', featureNumber: 3 },
  { id: 'guna-matching', label: 'Guna Matching', featureNumber: 4 },
  { id: 'seasonal-ritu', label: 'Seasonal Ritu', featureNumber: 5 },
  { id: 'weather-adaptation', label: 'Weather Adaptation', featureNumber: 6 },
  { id: 'five-element', label: 'Five Element', featureNumber: 7 },
  { id: 'organ-clock', label: 'Organ Clock', featureNumber: 8 },
  { id: 'thermal-nature', label: 'Thermal Nature', featureNumber: 9 },
  { id: 'tcm-flavor', label: 'TCM Flavor', featureNumber: 10 },
  { id: 'evidence-grading', label: 'Evidence Grading', featureNumber: 11 },
  { id: 'pubmed-citations', label: 'PubMed Citations', featureNumber: 12 },
  { id: 'honest-gaps', label: 'Honest Gaps', featureNumber: 13 },
  { id: 'convergence-detection', label: 'Convergence Detection', featureNumber: 14 },
  { id: 'contradiction-engine', label: 'Contradiction Engine', featureNumber: 15 },
  { id: 'blood-work-integration', label: 'Blood Work Integration', featureNumber: 16 },
  { id: 'face-scan', label: 'Face Scan', featureNumber: 17 },
  { id: 'check-in-patterns', label: 'Check-In Patterns', featureNumber: 18 },
  { id: 'food-feedback-loop', label: 'Food Feedback Loop', featureNumber: 19 },
  { id: 'anti-repetition', label: 'Anti-Repetition', featureNumber: 20 },
  { id: 'progressive-profiling', label: 'Progressive Profiling', featureNumber: 21 },
  { id: 'dietary-restrictions', label: 'Dietary Restrictions', featureNumber: 22 },
] as const;

/** Union of all valid feature ID strings. */
export type FeatureId = (typeof ALL_FEATURE_IDS)[number]['id'];

/** Single entry in the feature registry. */
export type FeatureEntry = (typeof ALL_FEATURE_IDS)[number];

// ---------------------------------------------------------------------------
// CreditSource
// ---------------------------------------------------------------------------

export type CreditSource = {
  featureId: string;
  featureName: string;
  active: boolean;
  contribution?: string;
};

// ---------------------------------------------------------------------------
// mergeCredits
// ---------------------------------------------------------------------------

/**
 * Merge multiple CreditSource arrays into a single deduplicated list.
 *
 * - Flattens all source arrays.
 * - Deduplicates by featureId. If the same featureId appears more than once,
 *   the merged entry has `active: true` if ANY source had it active.
 * - For `contribution`, uses the string from the first source where the
 *   feature was active. Falls back to the first non-undefined contribution.
 * - Returns the array sorted by featureId for deterministic output.
 */
export function mergeCredits(sources: CreditSource[][]): CreditSource[] {
  const flat = sources.flat();
  const map = new Map<
    string,
    { featureName: string; active: boolean; contribution: string | undefined }
  >();

  for (const src of flat) {
    const existing = map.get(src.featureId);
    if (!existing) {
      map.set(src.featureId, {
        featureName: src.featureName,
        active: src.active,
        contribution: src.contribution,
      });
    } else {
      // If any source is active, mark merged as active
      const wasActive = existing.active;
      existing.active = existing.active || src.active;

      // Contribution priority: first active source's contribution,
      // then fallback to first non-undefined contribution
      if (src.active && !wasActive && src.contribution !== undefined) {
        existing.contribution = src.contribution;
      } else if (existing.contribution === undefined && src.contribution !== undefined) {
        existing.contribution = src.contribution;
      }
    }
  }

  const result: CreditSource[] = [];
  for (const [featureId, val] of map) {
    result.push({
      featureId,
      featureName: val.featureName,
      active: val.active,
      contribution: val.contribution,
    });
  }

  return result.sort((a, b) => a.featureId.localeCompare(b.featureId));
}
