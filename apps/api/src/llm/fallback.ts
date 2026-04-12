/**
 * Multi-provider fallback with circuit breaker.
 *
 * Per-tradition fallback logic: when the primary provider fails after
 * exhausting retries, fall back to the secondary provider for that
 * specific tradition. The fallback is scoped per tradition -- one
 * tradition failing and falling back does not affect the others.
 *
 * Includes a standard open/half-open/closed circuit breaker to avoid
 * hammering a provider that is down.
 *
 * Depends on: tradition-caller (callTradition), provider-factory
 */

import type { z } from 'zod';

import type {
  CircuitBreakerConfig,
  CircuitState,
  ProviderDegradationEvent,
  TraditionCallResult,
  TraditionType,
} from '@triveda/shared/src/llm/types.js';
import { TraditionCallError } from '@triveda/shared/src/llm/types.js';
import { getTelemetryLogger } from './telemetry.js';
import { type CallOptions, callTradition } from './tradition-caller.js';

// ---------------------------------------------------------------------------
// Circuit breaker defaults
// ---------------------------------------------------------------------------

const DEFAULT_CIRCUIT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeoutMs: 30_000,
  halfOpenSuccessThreshold: 1,
};

// ---------------------------------------------------------------------------
// Circuit breaker
// ---------------------------------------------------------------------------

/**
 * Standard three-state circuit breaker per provider.
 *
 * - Closed (normal): requests go through, consecutive failures tracked.
 * - Open (tripped): after failureThreshold consecutive failures, all
 *   requests skip primary for resetTimeoutMs cooldown.
 * - Half-open (testing): after cooldown, one request is allowed through.
 *   Success closes the circuit; failure re-opens it.
 *
 * State is per-process and resets on server restart. One circuit breaker
 * per provider (Claude, Gemini), not per tradition.
 */
export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private consecutiveFailures = 0;
  private openedAt: number | null = null;
  private readonly failureThreshold: number;
  private readonly cooldownMs: number;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    const merged = { ...DEFAULT_CIRCUIT_CONFIG, ...config };
    this.failureThreshold = merged.failureThreshold;
    this.cooldownMs = merged.resetTimeoutMs;
  }

  /**
   * Returns true when the circuit is open and cooldown has NOT expired,
   * meaning the caller should skip the primary and go directly to fallback.
   *
   * When cooldown expires, transitions to half-open automatically.
   */
  shouldSkipPrimary(): boolean {
    if (this.state === 'closed') return false;

    if (this.state === 'open') {
      const now = Date.now();
      if (this.openedAt !== null && now - this.openedAt >= this.cooldownMs) {
        // Cooldown expired -- transition to half-open
        this.state = 'half_open';
        return false; // Allow one request through
      }
      return true; // Still in cooldown, skip primary
    }

    // half_open -- allow one request through
    return false;
  }

  /**
   * Record a successful call. Closes the circuit if half-open,
   * resets failure counter.
   */
  recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.openedAt = null;
    this.state = 'closed';
  }

  /**
   * Record a failed call. Increments consecutive failure count.
   * Opens the circuit when threshold is reached. Re-opens on
   * half-open failure.
   */
  recordFailure(): void {
    this.consecutiveFailures++;

    if (this.state === 'half_open') {
      // Half-open test failed -- re-open
      this.state = 'open';
      this.openedAt = Date.now();
      return;
    }

    if (this.consecutiveFailures >= this.failureThreshold) {
      this.state = 'open';
      this.openedAt = Date.now();
    }
  }

  /** Current circuit state (for observability). */
  getState(): CircuitState {
    return this.state;
  }

  /** Current consecutive failure count (for observability). */
  getFailureCount(): number {
    return this.consecutiveFailures;
  }

  /** Reset to initial state (for testing). */
  reset(): void {
    this.state = 'closed';
    this.consecutiveFailures = 0;
    this.openedAt = null;
  }
}

// ---------------------------------------------------------------------------
// Provider circuit breaker registry
// ---------------------------------------------------------------------------

/** One circuit breaker per provider, not per tradition. */
const providerCircuits: Record<string, CircuitBreaker> = {};

/**
 * Get or create a circuit breaker for a provider.
 */
export function getCircuitBreaker(
  provider: string,
  config?: Partial<CircuitBreakerConfig>,
): CircuitBreaker {
  if (!providerCircuits[provider]) {
    providerCircuits[provider] = new CircuitBreaker(config);
  }
  return providerCircuits[provider];
}

/**
 * Reset all circuit breakers (for testing).
 */
export function resetAllCircuitBreakers(): void {
  for (const key of Object.keys(providerCircuits)) {
    delete providerCircuits[key];
  }
}

// ---------------------------------------------------------------------------
// Fallback model mapping
// ---------------------------------------------------------------------------

/**
 * Primary -> fallback provider mapping.
 * Ayurveda/TCM/Synthesis primary is Claude, fallback is Gemini.
 * Naturopathy primary is Gemini, fallback is Claude.
 */
function getPrimaryProvider(tradition: TraditionType): string {
  if (tradition === 'naturopathy') return 'google-vertex';
  return 'anthropic';
}

function getFallbackProvider(tradition: TraditionType): string {
  if (tradition === 'naturopathy') return 'anthropic';
  return 'google-vertex';
}

function getPrimaryModelId(tradition: TraditionType): string {
  if (tradition === 'naturopathy') return 'gemini-2.5-flash';
  return 'claude-sonnet-4-6';
}

function getFallbackModelId(tradition: TraditionType): string {
  if (tradition === 'naturopathy') return 'claude-sonnet-4-6';
  return 'gemini-2.5-flash';
}

// ---------------------------------------------------------------------------
// callWithFallback
// ---------------------------------------------------------------------------

export interface FallbackResult<T> extends TraditionCallResult<T> {
  fallbackUsed: boolean;
  degradationEvent: ProviderDegradationEvent | null;
}

/**
 * Call a tradition with circuit breaker and fallback.
 *
 * Flow:
 * 1. Check circuit breaker state for the primary provider.
 * 2. If circuit is open (and cooldown not expired), skip to fallback.
 * 3. If closed or half-open, try callTradition with primary model.
 *    - On success: record success, return result.
 *    - On failure: record failure, proceed to fallback.
 * 4. Try callTradition with fallback model.
 * 5. On fallback success: log degradation event, return result.
 * 6. On fallback failure: throw TraditionCallError with
 *    cause 'fallback_exhausted'.
 */
export async function callWithFallback<T>(
  tradition: TraditionType,
  systemPrompt: string,
  userPrompt: string,
  schema: z.ZodType<T>,
  options: CallOptions,
): Promise<FallbackResult<T>> {
  const primaryProvider = getPrimaryProvider(tradition);
  const fallbackProvider = getFallbackProvider(tradition);
  const primaryModelId = getPrimaryModelId(tradition);
  const fallbackModelId = getFallbackModelId(tradition);

  const circuit = getCircuitBreaker(primaryProvider);
  const logger = getTelemetryLogger();

  // Check if we should skip primary
  const skipPrimary = circuit.shouldSkipPrimary();

  if (!skipPrimary) {
    // Try primary
    try {
      const result = await callTradition<T>(tradition, systemPrompt, userPrompt, schema, options);
      circuit.recordSuccess();
      return {
        ...result,
        fallbackUsed: false,
        degradationEvent: null,
      };
    } catch (primaryError: unknown) {
      circuit.recordFailure();
      // Log the primary failure, then fall through to fallback
      logger
        .log('warn', 'primary_provider_failed', {
          tradition,
          provider: primaryProvider,
          model: primaryModelId,
          error: primaryError instanceof Error ? primaryError.message : String(primaryError),
          circuitState: circuit.getState(),
          failureCount: circuit.getFailureCount(),
        })
        .catch(() => {
          // fire-and-forget logging
        });
    }
  }

  // Try fallback
  try {
    // For fallback, we call the tradition with a different model.
    // We use callTraditionWithModel to override the model selection.
    const result = await callTraditionAsFallback<T>(
      tradition,
      systemPrompt,
      userPrompt,
      schema,
      options,
      fallbackProvider,
    );

    const degradationEvent: ProviderDegradationEvent = {
      tradition,
      model: primaryModelId,
      errorType: 'provider_error',
      timestamp: Date.now(),
      fallbackUsed: true,
      fallbackModel: fallbackModelId,
    };

    logger
      .log('warn', 'provider_degraded', {
        tradition,
        primaryModel: primaryModelId,
        fallbackModel: fallbackModelId,
        circuitState: circuit.getState(),
      })
      .catch(() => {
        // fire-and-forget logging
      });

    return {
      ...result,
      fallbackUsed: true,
      degradationEvent,
    };
  } catch (fallbackError: unknown) {
    throw new TraditionCallError({
      tradition,
      cause: 'fallback_exhausted',
      message: `Both primary (${primaryModelId}) and fallback (${fallbackModelId}) failed for ${tradition}: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`,
      model: fallbackModelId,
    });
  }
}

// ---------------------------------------------------------------------------
// Fallback caller
// ---------------------------------------------------------------------------

/**
 * Call a tradition using the fallback provider. This swaps the tradition
 * to use the alternate provider's model via callTradition. The tradition
 * type used for model selection is mapped to the fallback provider.
 *
 * For traditions that use Claude as primary (ayurveda, tcm, synthesis),
 * fallback uses Gemini -- so we call callTradition with a synthetic
 * tradition type that maps to Gemini.
 *
 * For naturopathy (primary Gemini), fallback uses Claude -- so we call
 * with a synthetic tradition type that maps to Claude.
 *
 * In practice, we pass a model override tradition. Since the provider
 * factory maps naturopathy -> Gemini and everything else -> Claude,
 * we use 'naturopathy' as the tradition key to get Gemini, and
 * 'synthesis' as the tradition key to get Claude.
 */
async function callTraditionAsFallback<T>(
  _tradition: TraditionType,
  systemPrompt: string,
  userPrompt: string,
  schema: z.ZodType<T>,
  options: CallOptions,
  fallbackProvider: string,
): Promise<TraditionCallResult<T>> {
  // Map fallback provider to a tradition key that the provider factory
  // will resolve to the correct model:
  // - 'google-vertex' -> use 'naturopathy' (maps to Gemini)
  // - 'anthropic' -> use 'synthesis' (maps to Claude)
  const fallbackTraditionKey: TraditionType =
    fallbackProvider === 'google-vertex' ? 'naturopathy' : 'synthesis';

  return callTradition<T>(fallbackTraditionKey, systemPrompt, userPrompt, schema, options);
}
