/**
 * Three-signal confidence scoring.
 *
 * 1) Extraction method base
 * 2) Value-parsing quality adjustments
 * 3) Reference-range adjustments
 */

import type { NormalizedBiomarker } from './canonical-schema.js';
import type { ReviewReason } from './types.js';

export type ExtractionMethod = 'text' | 'vision';
export type VisionMediaType = 'application/pdf' | 'image/jpeg' | 'image/png';

export interface ConfidenceFlags {
  /** Set when the parser saw an unrecognized unit. */
  unknownUnit?: boolean;
  /** Set when the alias resolver matched multiple canonical keys. */
  ambiguous?: boolean;
}

export function computeConfidence(
  biomarker: NormalizedBiomarker,
  method: ExtractionMethod,
  visionMediaType?: VisionMediaType,
  flags: ConfidenceFlags = {},
): number {
  let base: number;
  if (method === 'text') {
    base = 0.95;
  } else if (visionMediaType === 'application/pdf') {
    base = 0.85;
  } else {
    base = 0.8;
  }

  let adj = 0;
  if (flags.unknownUnit) adj -= 0.1;
  if (flags.ambiguous) adj -= 0.15;

  const missingRange = biomarker.referenceRangeLow == null && biomarker.referenceRangeHigh == null;
  if (missingRange) adj -= 0.05;

  const raw = base + adj;
  return Math.max(0, Math.min(1, Number(raw.toFixed(3))));
}

export const CONFIDENCE_THRESHOLD = 0.8;

/**
 * Returns a single review reason or null. Priority order:
 *   low_confidence > ambiguous_value > unknown_unit > missing_reference_range
 */
export function shouldRouteToReview(
  biomarker: NormalizedBiomarker,
  confidence: number,
  flags: ConfidenceFlags = {},
): ReviewReason | null {
  if (confidence < CONFIDENCE_THRESHOLD) return 'low_confidence';
  if (flags.ambiguous) return 'ambiguous_value';
  if (flags.unknownUnit) return 'unknown_unit';
  if (biomarker.referenceRangeLow == null && biomarker.referenceRangeHigh == null) {
    return 'missing_reference_range';
  }
  return null;
}
