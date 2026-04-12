/**
 * LLM orchestration types.
 *
 * Defines input/output types for the three-tradition LLM pipeline:
 * Ayurveda, TCM, Naturopathy, plus Synthesis. All types use camelCase
 * field names (idiomatic TS). No runtime, no side effects.
 *
 * These types are consumed by:
 * - apps/api/src/llm/ (runtime implementation)
 * - apps/web/ (response types for SSE streaming)
 */

import type { ZodError } from 'zod';
import type { CreditSource } from '../credits.js';

// ---------------------------------------------------------------------------
// Tradition enum
// ---------------------------------------------------------------------------

/**
 * Partition key for provider selection, prompt loading, observability
 * tagging, and fallback routing. The 'synthesis' tradition merges the
 * outputs of the other three.
 */
export type TraditionType = 'ayurveda' | 'tcm' | 'naturopathy' | 'synthesis';

// ---------------------------------------------------------------------------
// Tradition input types
// ---------------------------------------------------------------------------

export interface AyurvedaInput {
  foodProperties: {
    rasa: string;
    virya: string;
    vipaka: string;
    guna: string[];
    doshaEffects: { vata: number; pitta: number; kapha: number };
  };
  doshaProfile: { vata: number; pitta: number; kapha: number };
  seasonalContext: {
    currentRitu: string;
    sandhiKala: boolean;
  };
  weatherAggravation: { vata: number; pitta: number; kapha: number };
  recentFoodFeedback: {
    foodId: string;
    accepted: boolean;
    date: string;
  }[];
  creditSources: CreditSource[];
}

export interface TCMInput {
  foodThermalNature: 'hot' | 'warm' | 'neutral' | 'cool' | 'cold';
  flavors: string[];
  organAffinities: string[];
  fiveElementScores: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  organClockHour: number;
  dominantOrgan: string;
  userElementType: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  seasonalTCMPhase: string;
  creditSources: CreditSource[];
}

export interface NaturopathyInput {
  nutritionalData: {
    macros: { protein: number; carbs: number; fat: number; fiber: number };
    keyMicronutrients: string[];
    glycemicIndex: number;
  };
  bioactiveCompounds: { name: string; amount: string }[];
  evidenceClaims: { claim: string; evidenceLevel: string; source: string }[];
  userBiomarkers?: { name: string; value: number; unit: string }[];
  creditSources: CreditSource[];
}

export interface SynthesisInput {
  ayurvedaOutput: AyurvedaOutput | null;
  tcmOutput: TCMOutput | null;
  naturopathyOutput: NaturopathyOutput | null;
  convergenceFlag: boolean;
  convergenceDimensions: {
    thermal: 'agree' | 'disagree' | 'neutral';
    constitutional: 'agree' | 'disagree' | 'neutral';
    seasonal: 'agree' | 'disagree' | 'neutral';
    evidence: 'agree' | 'disagree' | 'neutral';
  };
  selectedFoodName: string;
  selectedFoodId: string;
  creditSources: CreditSource[];
}

// ---------------------------------------------------------------------------
// Tradition output types (match Zod schemas in prompts/v1/schemas.ts)
// ---------------------------------------------------------------------------

export interface AyurvedaOutput {
  rasa: string;
  virya: string;
  vipaka: string;
  doshaRationale: string;
  plainEnglish: string;
}

export interface TCMOutput {
  thermal: string;
  element: string;
  organClock: string;
  plainEnglish: string;
}

export interface NaturopathyOutput {
  evidenceLevel: 'strong' | 'moderate' | 'preliminary' | 'traditional_only' | 'none';
  pubmedCitations: { claim: string; source: string; year?: number }[];
  honestGaps: string[];
  plainEnglish: string;
}

export interface SynthesisOutput {
  convergenceFraming: string;
  twoSentenceRationale: string;
}

// ---------------------------------------------------------------------------
// Composite input/output for the full daily food pipeline
// ---------------------------------------------------------------------------

export interface DailyFoodInput {
  requestId: string;
  userId: string;
  ayurveda: AyurvedaInput;
  tcm: TCMInput;
  naturopathy: NaturopathyInput;
  synthesis: SynthesisInput;
}

export interface DailyFoodLLMResult {
  ayurveda: AyurvedaOutput | null;
  tcm: TCMOutput | null;
  naturopathy: NaturopathyOutput | null;
  synthesis: SynthesisOutput | null;
  metadata: OrchestrationMetadata;
}

// ---------------------------------------------------------------------------
// Metadata and call result types
// ---------------------------------------------------------------------------

export interface OrchestrationMetadata {
  requestId: string;
  totalLatencyMs: number;
  perTraditionLatency: Record<TraditionType, number>;
  totalCostUsd: number;
  perTraditionCost: Record<TraditionType, number>;
  failedTraditions: TraditionType[];
  degradationEvents: ProviderDegradationEvent[];
  creditSources: CreditSource[];
}

export interface CallMetadata {
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  latencyFirstByteMs: number;
  latencyTotalMs: number;
  cacheHit: boolean;
  model: string;
}

export interface TraditionCallResult<T> {
  output: T;
  metadata: CallMetadata;
}

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export type TraditionCallErrorCause =
  | 'validation_failed'
  | 'provider_error'
  | 'timeout'
  | 'fallback_exhausted';

/**
 * Error thrown when a tradition LLM call fails. Carries structured
 * context for observability and fallback decisions.
 */
export class TraditionCallError extends Error {
  readonly tradition: TraditionType;
  readonly cause: TraditionCallErrorCause;
  readonly rawResponse: string | undefined;
  readonly zodError: ZodError | undefined;
  readonly model: string;

  constructor(opts: {
    tradition: TraditionType;
    cause: TraditionCallErrorCause;
    message: string;
    rawResponse?: string;
    zodError?: ZodError;
    model: string;
  }) {
    super(opts.message);
    this.name = 'TraditionCallError';
    this.tradition = opts.tradition;
    this.cause = opts.cause;
    this.rawResponse = opts.rawResponse;
    this.zodError = opts.zodError;
    this.model = opts.model;
  }
}

// ---------------------------------------------------------------------------
// Provider degradation / circuit breaker types
// ---------------------------------------------------------------------------

export type CircuitState = 'closed' | 'open' | 'half_open';

export interface CircuitBreakerConfig {
  /** Number of failures before opening the circuit. */
  failureThreshold: number;
  /** Milliseconds to wait before transitioning from open to half_open. */
  resetTimeoutMs: number;
  /** Number of successes in half_open before closing the circuit. */
  halfOpenSuccessThreshold: number;
}

export interface CircuitBreakerState {
  state: CircuitState;
  failureCount: number;
  lastFailureAt: number | null;
  successCount: number;
}

export interface ProviderDegradationEvent {
  tradition: TraditionType;
  model: string;
  errorType: TraditionCallErrorCause;
  timestamp: number;
  fallbackUsed: boolean;
  fallbackModel?: string;
}

// ---------------------------------------------------------------------------
// Cost estimation types
// ---------------------------------------------------------------------------

export interface CostEstimate {
  tradition: TraditionType;
  model: string;
  estimatedTokensIn: number;
  estimatedTokensOut: number;
  estimatedCostUsd: number;
}

export interface TotalCostEstimate {
  perTradition: CostEstimate[];
  totalEstimatedCostUsd: number;
}

// ---------------------------------------------------------------------------
// SSE event types for frontend consumption
// ---------------------------------------------------------------------------

export type SSEEventType =
  | 'tradition_start'
  | 'tradition_complete'
  | 'tradition_error'
  | 'synthesis_start'
  | 'synthesis_complete'
  | 'orchestration_complete'
  | 'error';

export interface SSEEventBase {
  type: SSEEventType;
  requestId: string;
  timestamp: number;
}

export interface TraditionStartEvent extends SSEEventBase {
  type: 'tradition_start';
  tradition: TraditionType;
  model: string;
}

export interface TraditionCompleteEvent extends SSEEventBase {
  type: 'tradition_complete';
  tradition: TraditionType;
  output: AyurvedaOutput | TCMOutput | NaturopathyOutput;
  metadata: CallMetadata;
}

export interface TraditionErrorEvent extends SSEEventBase {
  type: 'tradition_error';
  tradition: TraditionType;
  errorCause: TraditionCallErrorCause;
  fallbackUsed: boolean;
}

export interface SynthesisStartEvent extends SSEEventBase {
  type: 'synthesis_start';
  model: string;
}

export interface SynthesisCompleteEvent extends SSEEventBase {
  type: 'synthesis_complete';
  output: SynthesisOutput;
  metadata: CallMetadata;
}

export interface OrchestrationCompleteEvent extends SSEEventBase {
  type: 'orchestration_complete';
  result: DailyFoodLLMResult;
}

export interface OrchestrationErrorEvent extends SSEEventBase {
  type: 'error';
  message: string;
}

export type SSEEvent =
  | TraditionStartEvent
  | TraditionCompleteEvent
  | TraditionErrorEvent
  | SynthesisStartEvent
  | SynthesisCompleteEvent
  | OrchestrationCompleteEvent
  | OrchestrationErrorEvent;

// ---------------------------------------------------------------------------
// Provider config types
// ---------------------------------------------------------------------------

export interface ProviderConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  provider: 'anthropic' | 'google-vertex';
}

export interface TraditionProviderMap {
  ayurveda: ProviderConfig;
  tcm: ProviderConfig;
  naturopathy: ProviderConfig;
  synthesis: ProviderConfig;
}

/**
 * Default provider configuration per tradition.
 * Anthropic Claude for Ayurveda/TCM/Synthesis, Google Vertex for Naturopathy.
 */
export const DEFAULT_PROVIDER_MAP: TraditionProviderMap = {
  ayurveda: {
    model: 'claude-sonnet-4-6',
    temperature: 0.3,
    maxTokens: 1024,
    provider: 'anthropic',
  },
  tcm: {
    model: 'claude-sonnet-4-6',
    temperature: 0.3,
    maxTokens: 1024,
    provider: 'anthropic',
  },
  naturopathy: {
    model: 'gemini-2.5-flash',
    temperature: 0.2,
    maxTokens: 1024,
    provider: 'google-vertex',
  },
  synthesis: {
    model: 'claude-sonnet-4-6',
    temperature: 0.4,
    maxTokens: 512,
    provider: 'anthropic',
  },
};
