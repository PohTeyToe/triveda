/**
 * Mock LLM provider for testing and demo mode.
 *
 * Returns realistic fixed responses for each tradition without making
 * any network calls. Activated when TRIVEDA_LLM_MODE=mock.
 *
 * Features:
 * - Deterministic responses keyed by tradition
 * - Configurable latency simulation
 * - Zero network calls (verified by tests)
 * - Responses pass Zod validation for each tradition schema
 */

import type {
  AyurvedaOutput,
  CallMetadata,
  NaturopathyOutput,
  SynthesisOutput,
  TCMOutput,
  TraditionCallResult,
  TraditionType,
} from '@triveda/shared/src/llm/types.js';

// ---------------------------------------------------------------------------
// Mock response fixtures (inline, no file I/O)
// ---------------------------------------------------------------------------

const MOCK_AYURVEDA: AyurvedaOutput = {
  rasa: 'Madhura (sweet)',
  virya: 'Sheeta (cooling)',
  vipaka: 'Madhura (sweet post-digestive)',
  doshaRationale:
    'Oats are Guru (heavy) and Snigdha (oily), which directly ground Vata. ' +
    'The sweet rasa and cooling virya pacify both Vata and Pitta doshas. ' +
    'However, the heavy quality may slightly increase Kapha if consumed in excess.',
  plainEnglish:
    'Oats are grounding and cooling -- a good choice for your Vata-dominant constitution, ' +
    'especially during warmer months. Eat them warm with digestive spices to offset any heaviness.',
};

const MOCK_TCM: TCMOutput = {
  thermal: 'Warm',
  element: 'Earth',
  organClock:
    'Oats align with the Spleen-Stomach meridian pair (7-11 AM). ' +
    'Eating them in the morning supports Earth element digestion.',
  plainEnglish:
    'From a Chinese medicine perspective, oats strengthen your digestive center. ' +
    'Their warm nature and Earth affinity make them ideal for morning meals.',
};

const MOCK_NATUROPATHY: NaturopathyOutput = {
  evidenceLevel: 'strong',
  pubmedCitations: [
    {
      claim: 'Beta-glucan in oats reduces LDL cholesterol',
      source: 'PMC4690088',
      year: 2016,
    },
    {
      claim: 'Oat consumption improves glycemic control',
      source: 'PMC7589116',
      year: 2020,
    },
  ],
  honestGaps: [
    'Long-term effects of daily oat consumption on gut microbiome diversity are understudied',
    'Optimal serving size for cardiovascular benefit varies by individual',
  ],
  plainEnglish:
    'Strong clinical evidence supports oats for cholesterol reduction and blood sugar management. ' +
    'Beta-glucan fiber is the primary active compound with well-documented mechanisms.',
};

const MOCK_SYNTHESIS_CONVERGE: SynthesisOutput = {
  convergenceFraming:
    'All three traditions agree: oats are a supportive, grounding food for this constitution. ' +
    'Ayurveda values the Vata-pacifying sweet rasa, TCM highlights Earth-element nourishment, ' +
    'and naturopathy confirms strong evidence for metabolic benefits.',
  twoSentenceRationale:
    'Oats are a well-supported morning food across all three traditions. ' +
    'Eat them warm with digestive spices for the best constitutional fit.',
};

const MOCK_SYNTHESIS_DIVERGE: SynthesisOutput = {
  convergenceFraming:
    'The traditions offer different perspectives on this food. ' +
    'Ayurveda finds it moderately suitable, TCM sees thermal mismatch with the current season, ' +
    'while naturopathy supports it based on nutritional evidence.',
  twoSentenceRationale:
    'This food has mixed traditional support but solid nutritional evidence. ' +
    'Consider portion size and seasonal timing when including it in your routine.',
};

// Map of tradition -> mock output
const MOCK_OUTPUTS: Record<string, unknown> = {
  ayurveda: MOCK_AYURVEDA,
  tcm: MOCK_TCM,
  naturopathy: MOCK_NATUROPATHY,
  'synthesis-converge': MOCK_SYNTHESIS_CONVERGE,
  'synthesis-diverge': MOCK_SYNTHESIS_DIVERGE,
  synthesis: MOCK_SYNTHESIS_CONVERGE, // default synthesis uses convergence
};

// ---------------------------------------------------------------------------
// Mock metadata
// ---------------------------------------------------------------------------

function buildMockMetadata(tradition: TraditionType): CallMetadata {
  const modelMap: Record<TraditionType, string> = {
    ayurveda: 'claude-sonnet-4-6',
    tcm: 'claude-sonnet-4-6',
    naturopathy: 'gemini-2.5-flash',
    synthesis: 'claude-sonnet-4-6',
  };

  const tokenEstimates: Record<TraditionType, { tokensIn: number; tokensOut: number }> = {
    ayurveda: { tokensIn: 1200, tokensOut: 300 },
    tcm: { tokensIn: 1100, tokensOut: 280 },
    naturopathy: { tokensIn: 1400, tokensOut: 400 },
    synthesis: { tokensIn: 800, tokensOut: 200 },
  };

  const tokens = tokenEstimates[tradition];
  return {
    tokensIn: tokens.tokensIn,
    tokensOut: tokens.tokensOut,
    costUsd: 0,
    latencyFirstByteMs: 0,
    latencyTotalMs: 0,
    cacheHit: false,
    model: modelMap[tradition],
  };
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface MockProviderOptions {
  /** Simulated latency in milliseconds (default: 0) */
  delayMs?: number;
  /** Use divergent synthesis output instead of convergent (default: false) */
  divergentSynthesis?: boolean;
}

// ---------------------------------------------------------------------------
// Mock provider
// ---------------------------------------------------------------------------

/**
 * Check if mock mode is active.
 */
export function isMockMode(): boolean {
  return process.env.TRIVEDA_LLM_MODE === 'mock';
}

/**
 * Get a mock response for a given tradition.
 *
 * Returns a TraditionCallResult with realistic fixture data and zero-cost
 * metadata. No network calls are made. Configurable delay simulates latency.
 */
export async function getMockResponse<T>(
  tradition: TraditionType,
  options: MockProviderOptions = {},
): Promise<TraditionCallResult<T>> {
  const { delayMs = 0, divergentSynthesis = false } = options;

  // Simulate latency if requested
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  // Select the right fixture
  let key: string = tradition;
  if (tradition === 'synthesis') {
    key = divergentSynthesis ? 'synthesis-diverge' : 'synthesis-converge';
  }

  const output = MOCK_OUTPUTS[key];
  if (!output) {
    throw new Error(`No mock fixture found for tradition: ${tradition}`);
  }

  const metadata = buildMockMetadata(tradition);
  if (delayMs > 0) {
    metadata.latencyTotalMs = delayMs;
  }

  return {
    output: output as T,
    metadata,
  };
}

/**
 * Get all available mock outputs (for test inspection).
 */
export function getMockOutputs(): Record<string, unknown> {
  return { ...MOCK_OUTPUTS };
}
