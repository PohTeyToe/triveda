/**
 * LLM runtime module public API.
 *
 * Server-only code. Exports the provider factory, config, telemetry,
 * mock provider, and input sanitization functions.
 */

export { getModelForTradition, getFallbackModel } from './provider-factory.js';
export {
  calculateCost,
  getProviderConfig,
  checkLLMEnv,
  MODEL_COST_RATES,
  type ModelCostRate,
  type LLMEnvStatus,
} from './config.js';

// Section 06: Observability
export {
  logLLMCall,
  computePromptHash,
  computeCost,
  aggregateCosts,
  buildLogEntry,
  createStderrLogger,
  setTelemetryLogger,
  getTelemetryLogger,
  type LLMCallLogEntry,
  type CacheStatus,
} from './telemetry.js';

// Section 07: Mock provider
export {
  getMockResponse,
  getMockOutputs,
  isMockMode,
  type MockProviderOptions,
} from './mock-provider.js';

// Section 08: Injection defense
export {
  sanitizeUserInput,
  wrapUserInput,
  validateInputLength,
  checkContentSafety,
  MAX_INPUT_LENGTH,
  type InputLengthResult,
  type ContentSafetyResult,
} from './sanitizer.js';

// Section 02: Prompt templates
export {
  buildAyurvedaSystemPrompt,
  buildAyurvedaUserPrompt,
  buildTCMSystemPrompt,
  buildTCMUserPrompt,
  buildNaturopathySystemPrompt,
  buildNaturopathyUserPrompt,
  buildSynthesisSystemPrompt,
  buildSynthesisUserPrompt,
  type AyurvedaFoodFactSheet,
  type TCMFoodFactSheet,
  type NaturopathyFoodFactSheet,
} from './prompts/index.js';

// Section 03: Tradition caller
export { callTradition, type CallOptions } from './tradition-caller.js';

// Section 05: Fallback + circuit breaker
export {
  callWithFallback,
  CircuitBreaker,
  getCircuitBreaker,
  resetAllCircuitBreakers,
  type FallbackResult,
} from './fallback.js';

// Section 04: Orchestrator
export { orchestrateDailyFood } from './orchestrator.js';

// Section 09: SSE streaming
export {
  createSSEStream,
  createNonStreamingResponse,
  type SSEOutputEvent,
} from './streaming.js';
