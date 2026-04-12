/**
 * Shared types for the blood work processing pipeline.
 */

export type VendorType = 'lifelabs' | 'quest' | 'labcorp' | 'ahs' | 'unknown';
export type ExtractionMethod = 'text' | 'vision' | 'hybrid';
export type BiomarkerFlag = 'normal' | 'low' | 'high' | 'critical';
export type ReviewReason =
  | 'low_confidence'
  | 'ambiguous_value'
  | 'unknown_unit'
  | 'missing_reference_range';

export type ReportStatus = 'pending' | 'processing' | 'complete' | 'failed';

export interface RawBiomarker {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  pageIndex: number;
}

/**
 * Tradition context strings for a single biomarker.
 */
export interface TraditionContext {
  ayurveda: string;
  tcm: string;
  naturopathy: string;
}

/**
 * A single entry in the canonical biomarker registry.
 */
export interface CanonicalBiomarkerEntry {
  canonicalKey: string;
  displayName: string;
  canonicalUnit: string;
  loincCode: string;
  conversionFactors: Record<string, number | ((v: number) => number)>;
}

/**
 * Food influence for a single food-biomarker relationship.
 */
export interface FoodInfluence {
  foodId: string;
  foodName: string;
  effectDirection: 'supportive' | 'contraindicated';
  effectMagnitude: number;
  mechanism: string | null;
  citation: string;
}

/**
 * Map of canonical biomarker key to food influence groups.
 */
export type FoodInfluenceMap = Record<
  string,
  {
    biomarkerName: string;
    supportive: FoodInfluence[];
    contraindicated: FoodInfluence[];
  }
>;

/**
 * Job status returned to the frontend for polling.
 */
export interface BloodWorkJobStatus {
  id: string;
  jobId: string;
  status: ReportStatus;
  stage: string | null;
  fileName: string;
  vendor: string | null;
  biomarkerCount: number;
  errorMessage: string | null;
  uploadedAt: string;
}
