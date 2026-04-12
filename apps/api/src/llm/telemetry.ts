/**
 * LLM call observability -- logging and cost tracking.
 *
 * Fire-and-forget logging of every LLM call to stderr as structured JSON.
 * Cost computation uses the centralized pricing table from config.ts.
 * Database logging (Drizzle -> llm_calls table) is deferred to when
 * packages/db ships the schema; this module logs to stderr now.
 */

import type { CallMetadata, TraditionType } from '@triveda/shared/src/llm/types.js';
import type { TelemetryLogger } from '@triveda/shared/src/telemetry.js';
import { MODEL_COST_RATES } from './config.js';

// ---------------------------------------------------------------------------
// LLM call log entry
// ---------------------------------------------------------------------------

export interface LLMCallLogEntry {
  requestId: string;
  userId: string;
  foodId: string;
  tradition: TraditionType;
  model: string;
  promptHash: string;
  promptVersion: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  latencyFirstByteMs: number | null;
  latencyTotalMs: number;
  cacheHit: boolean;
  responseJson: unknown | null;
  error: string | null;
  fallbackUsed: boolean;
}

// ---------------------------------------------------------------------------
// Prompt hash computation
// ---------------------------------------------------------------------------

/**
 * Compute a SHA-256 hex digest of the combined system + user prompt.
 * Uses the Web Crypto API (available in Bun and Node 18+).
 */
export function computePromptHash(systemPrompt: string, userPrompt: string): string {
  // Use Node built-in crypto for synchronous hashing
  const crypto = require('node:crypto') as typeof import('crypto');
  return crypto
    .createHash('sha256')
    .update(systemPrompt + userPrompt)
    .digest('hex');
}

// ---------------------------------------------------------------------------
// Telemetry logger implementation
// ---------------------------------------------------------------------------

/**
 * Creates a TelemetryLogger that writes structured JSON to stderr.
 * This satisfies the TelemetryLogger interface from @triveda/shared.
 */
export function createStderrLogger(): TelemetryLogger {
  return {
    async log(
      level: 'info' | 'warn' | 'error',
      message: string,
      metadata?: Record<string, unknown>,
    ): Promise<void> {
      const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...metadata,
      };
      process.stderr.write(`${JSON.stringify(entry)}\n`);
    },
  };
}

// Default logger instance
let _logger: TelemetryLogger = createStderrLogger();

/**
 * Replace the default logger (useful for testing).
 */
export function setTelemetryLogger(logger: TelemetryLogger): void {
  _logger = logger;
}

/**
 * Get the current logger instance.
 */
export function getTelemetryLogger(): TelemetryLogger {
  return _logger;
}

// ---------------------------------------------------------------------------
// Fire-and-forget LLM call logging
// ---------------------------------------------------------------------------

/**
 * Log an LLM call. Fire-and-forget: never throws, never blocks the caller.
 * On failure, writes a structured error to stderr.
 */
export function logLLMCall(entry: LLMCallLogEntry): void {
  // Fire-and-forget -- errors are caught and logged, never thrown
  _logger
    .log('info', 'llm_call', {
      event: 'llm_call_logged',
      requestId: entry.requestId,
      userId: entry.userId,
      foodId: entry.foodId,
      tradition: entry.tradition,
      model: entry.model,
      promptHash: entry.promptHash,
      promptVersion: entry.promptVersion,
      tokensIn: entry.tokensIn,
      tokensOut: entry.tokensOut,
      costUsd: entry.costUsd,
      latencyFirstByteMs: entry.latencyFirstByteMs,
      latencyTotalMs: entry.latencyTotalMs,
      cacheHit: entry.cacheHit,
      responseJson: entry.responseJson,
      error: entry.error,
      fallbackUsed: entry.fallbackUsed,
    })
    .catch((err: unknown) => {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const failEntry = {
        event: 'llm_call_log_failed',
        error: errorMessage,
        tradition: entry.tradition,
        requestId: entry.requestId,
      };
      process.stderr.write(`${JSON.stringify(failEntry)}\n`);
    });
}

// ---------------------------------------------------------------------------
// Cost computation with cache status
// ---------------------------------------------------------------------------

export type CacheStatus = 'hit' | 'write' | 'none';

/**
 * Compute cost in USD for a given model, token counts, and cache status.
 *
 * Cache pricing adjustments:
 * - hit:   input cost = 0.1x base
 * - write: input cost = 1.25x base
 * - none:  input cost = 1.0x base (default)
 */
export function computeCost(
  model: string,
  tokensIn: number,
  tokensOut: number,
  cacheStatus: CacheStatus = 'none',
): number {
  const rates = MODEL_COST_RATES[model];
  if (!rates) return 0;
  if (tokensIn === 0 && tokensOut === 0) return 0;

  let inputMultiplier = 1.0;
  if (cacheStatus === 'hit') inputMultiplier = 0.1;
  else if (cacheStatus === 'write') inputMultiplier = 1.25;

  const inputCost = (tokensIn * rates.inputPer1M * inputMultiplier) / 1_000_000;
  const outputCost = (tokensOut * rates.outputPer1M) / 1_000_000;

  return inputCost + outputCost;
}

// ---------------------------------------------------------------------------
// Cost aggregation
// ---------------------------------------------------------------------------

/**
 * Aggregate costs across multiple tradition calls.
 */
export function aggregateCosts(entries: Pick<LLMCallLogEntry, 'tradition' | 'costUsd'>[]): {
  totalCostUsd: number;
  perTradition: Record<string, number>;
} {
  const perTradition: Record<string, number> = {};
  let totalCostUsd = 0;

  for (const entry of entries) {
    perTradition[entry.tradition] = (perTradition[entry.tradition] ?? 0) + entry.costUsd;
    totalCostUsd += entry.costUsd;
  }

  return { totalCostUsd, perTradition };
}

// ---------------------------------------------------------------------------
// Build log entry from call metadata
// ---------------------------------------------------------------------------

/**
 * Build an LLMCallLogEntry from call metadata and context.
 */
export function buildLogEntry(
  context: {
    requestId: string;
    userId: string;
    foodId: string;
    tradition: TraditionType;
    promptHash: string;
    promptVersion: string;
    fallbackUsed: boolean;
  },
  metadata: CallMetadata,
  responseJson: unknown | null,
  error: string | null,
): LLMCallLogEntry {
  return {
    requestId: context.requestId,
    userId: context.userId,
    foodId: context.foodId,
    tradition: context.tradition,
    model: metadata.model,
    promptHash: context.promptHash,
    promptVersion: context.promptVersion,
    tokensIn: metadata.tokensIn,
    tokensOut: metadata.tokensOut,
    costUsd: metadata.costUsd,
    latencyFirstByteMs: metadata.latencyFirstByteMs,
    latencyTotalMs: metadata.latencyTotalMs,
    cacheHit: metadata.cacheHit,
    responseJson,
    error,
    fallbackUsed: context.fallbackUsed,
  };
}
