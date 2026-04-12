/**
 * LLM orchestration public API surface.
 *
 * Types and Zod schemas only -- runtime implementations live in
 * apps/api/src/llm/ (per amendment 003). This package is safe to
 * import from both apps/web and apps/api.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type {
  TraditionType,
  AyurvedaInput,
  TCMInput,
  NaturopathyInput,
  SynthesisInput,
  AyurvedaOutput,
  TCMOutput,
  NaturopathyOutput,
  SynthesisOutput,
  DailyFoodInput,
  DailyFoodLLMResult,
  OrchestrationMetadata,
  CallMetadata,
  TraditionCallResult,
  TraditionCallErrorCause,
  CircuitState,
  CircuitBreakerConfig,
  CircuitBreakerState,
  ProviderDegradationEvent,
  CostEstimate,
  TotalCostEstimate,
  SSEEventType,
  SSEEvent,
  SSEEventBase,
  TraditionStartEvent,
  TraditionCompleteEvent,
  TraditionErrorEvent,
  SynthesisStartEvent,
  SynthesisCompleteEvent,
  OrchestrationCompleteEvent,
  OrchestrationErrorEvent,
  ProviderConfig,
  TraditionProviderMap,
} from './types.js';

export { TraditionCallError, DEFAULT_PROVIDER_MAP } from './types.js';

// ---------------------------------------------------------------------------
// Zod output schemas
// ---------------------------------------------------------------------------

export {
  ayurvedaOutputSchema,
  tcmOutputSchema,
  naturopathyOutputSchema,
  synthesisOutputSchema,
} from './prompts/v1/schemas.js';

export type {
  AyurvedaSchemaOutput,
  TCMSchemaOutput,
  NaturopathySchemaOutput,
  SynthesisSchemaOutput,
} from './prompts/v1/schemas.js';
