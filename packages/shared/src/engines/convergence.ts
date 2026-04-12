/**
 * ConvergenceDetector interface.
 *
 * Detects agreement and disagreement across the three traditions'
 * recommendations. Implemented in split 02.
 */

export interface TraditionRecommendation {
  tradition: 'ayurveda' | 'tcm' | 'naturopathy';
  foodId: string;
  score: number;
  reasoning: string;
}

export interface ConvergenceResult {
  agreed: string[];
  contested: string[];
  divergent: string[];
  overallAgreement: number;
}

export interface ConvergenceDetector {
  /** Detect convergence across tradition recommendations. */
  detectConvergence(recommendations: TraditionRecommendation[]): ConvergenceResult;
}
