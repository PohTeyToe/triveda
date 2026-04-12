/**
 * Legacy convergence interface stubs from split 01.
 * Retained for compatibility. Real implementation uses computeConvergence().
 */

export interface TraditionRecommendation {
  tradition: 'ayurveda' | 'tcm' | 'naturopathy';
  foodId: string;
  score: number;
  rationale: string;
}

export interface ConvergenceDetector {
  /** Detect agreement/disagreement across tradition recommendations. */
  detectConvergence(recommendations: TraditionRecommendation[]): {
    agreement: number;
    dimensions: string[];
  };
}
