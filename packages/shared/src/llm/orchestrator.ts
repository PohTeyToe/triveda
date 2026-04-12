/**
 * TraditionOrchestrator interface.
 *
 * Runs three isolated LLM calls (one per tradition) and merges the
 * results. Each tradition's call gets only its own context, preventing
 * cross-tradition contamination. Types only -- runtime lives in apps/api.
 */

export type TraditionType = 'ayurveda' | 'tcm' | 'naturopathy';

export interface AnalysisInput {
  userId: string;
  foodId: string;
  tradition: TraditionType;
  context: Record<string, unknown>;
}

export interface TraditionAnalysisResult {
  tradition: TraditionType;
  recommendation: string;
  confidence: number;
  reasoning: string;
}

export interface TraditionAnalysis {
  results: TraditionAnalysisResult[];
  convergence: {
    agreed: string[];
    contested: string[];
  };
}

export interface TraditionOrchestrator {
  /** Run analysis across all three traditions and merge results. */
  analyze(input: AnalysisInput): Promise<TraditionAnalysis>;
}
