/**
 * Credit composer for non-scoring endpoints.
 *
 * Generates a full 22-entry CreditSource[] for endpoints that do not go
 * through the scoring pipeline (constitution, weekly-herb, triggered-recs).
 * Ensures every recommendation response includes the complete feature credit array.
 */

import { ALL_FEATURE_IDS, type CreditSource } from '@triveda/shared/src/credits.js';

export type EndpointType = 'constitution' | 'weekly-herb' | 'triggered-recs';

/**
 * Feature classification by endpoint.
 * Maps feature IDs to their contribution type per endpoint.
 * Features not listed are classified as 'latent' by default.
 */
const ACTIVE_FEATURES: Record<EndpointType, Set<string>> = {
  constitution: new Set(['dosha-analysis', 'progressive-profiling']),
  'weekly-herb': new Set(['seasonal-ritu', 'evidence-grading', 'thermal-nature']),
  'triggered-recs': new Set(['organ-clock', 'check-in-patterns']),
};

const FUTURE_FEATURES = new Set([
  'pubmed-citations',
  'face-scan',
  'contradiction-engine',
  'food-feedback-loop',
  'dietary-restrictions',
]);

/**
 * Compose a 22-entry CreditSource[] for a non-scoring endpoint.
 *
 * Each entry's contribution is determined by endpoint type:
 * - active: feature was computed for this endpoint
 * - latent: feature exists but was not used
 * - future: feature not yet implemented
 */
export function composeCredits(endpointType: EndpointType): CreditSource[] {
  const activeSet = ACTIVE_FEATURES[endpointType];

  return ALL_FEATURE_IDS.map((feature) => {
    const isFuture = FUTURE_FEATURES.has(feature.id);
    const isActive = activeSet.has(feature.id);

    let contribution: string;
    if (isFuture) {
      contribution = 'future';
    } else if (isActive) {
      contribution = 'active';
    } else {
      contribution = 'latent';
    }

    return {
      featureId: feature.id,
      featureName: feature.label,
      active: isActive,
      contribution,
    };
  });
}
