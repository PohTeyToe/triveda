/**
 * Tradition caller -- the workhorse for single tradition LLM calls.
 *
 * Handles:
 * - Model selection via provider factory
 * - Structured output via Vercel AI SDK Output.object() + Zod schema
 * - Retry on NoObjectGeneratedError with a stricter prompt
 * - Timeout and abort signal support
 * - Cost calculation from token usage
 * - Error wrapping in TraditionCallError with cause chain
 *
 * The orchestrator (Section 04) calls this four times -- once per
 * tradition plus synthesis.
 */

import { NoObjectGeneratedError, Output, generateText } from 'ai';
import type { z } from 'zod';

import type {
  CallMetadata,
  TraditionCallResult,
  TraditionType,
} from '@triveda/shared/llm/types.js';
import { TraditionCallError } from '@triveda/shared/llm/types.js';
import { calculateCost } from './config.js';
import { getModelForTradition } from './provider-factory.js';

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface CallOptions {
  /** Shared UUID from the orchestrator for request correlation. */
  requestId: string;
  /** User ID for observability logging. */
  userId: string;
  /** Food ID for observability logging. */
  foodId: string;
  /** Prompt version string, e.g. "v1". */
  promptVersion: string;
  /** Abort signal for client cancellation. */
  signal?: AbortSignal;
}

// ---------------------------------------------------------------------------
// callTradition
// ---------------------------------------------------------------------------

/**
 * Make a single tradition LLM call with structured output validation.
 *
 * Flow:
 * 1. Get model from provider factory
 * 2. Call generateText with Output.object() for Zod-validated output
 * 3. On NoObjectGeneratedError, retry once with a stricter prompt
 * 4. On second failure, throw TraditionCallError
 * 5. Calculate cost and return TraditionCallResult with metadata
 */
export async function callTradition<T>(
  tradition: TraditionType,
  systemPrompt: string,
  userPrompt: string,
  schema: z.ZodType<T>,
  options: CallOptions,
): Promise<TraditionCallResult<T>> {
  const model = getModelForTradition(tradition);
  const modelId = tradition === 'naturopathy' ? 'gemini-2.5-flash' : 'claude-sonnet-4-6';
  const startTime = performance.now();

  try {
    // First attempt
    const result = await generateText({
      model,
      output: Output.object({ schema }),
      system: systemPrompt,
      prompt: userPrompt,
      maxRetries: 3, // HTTP-level retries for 429, 5xx
      abortSignal: options.signal,
    });

    const endTime = performance.now();
    const metadata = buildMetadata(result, modelId, startTime, endTime);

    // Output.object() returns the parsed output on result.output
    // If we got here without NoObjectGeneratedError, the output is valid
    return {
      output: result.output as T,
      metadata,
    };
  } catch (error: unknown) {
    // Handle structured output validation failure
    if (NoObjectGeneratedError.isInstance(error)) {
      return handleRetry<T>(
        tradition,
        modelId,
        model,
        systemPrompt,
        userPrompt,
        schema,
        options,
        startTime,
        error,
      );
    }

    // All other errors (network, timeout, etc.)
    throw new TraditionCallError({
      tradition,
      cause: 'provider_error',
      message: error instanceof Error ? error.message : 'Unknown provider error',
      model: modelId,
    });
  }
}

// ---------------------------------------------------------------------------
// Retry logic
// ---------------------------------------------------------------------------

async function handleRetry<T>(
  tradition: TraditionType,
  modelId: string,
  model: ReturnType<typeof getModelForTradition>,
  systemPrompt: string,
  originalUserPrompt: string,
  schema: z.ZodType<T>,
  options: CallOptions,
  startTime: number,
  _firstError: unknown,
): Promise<TraditionCallResult<T>> {
  // Build a stricter prompt with explicit schema field requirements
  const schemaDescription = describeSchemaFields(schema);
  const strictReminder = `

STRICT REMINDER: Your previous response did not match the required JSON schema. You MUST respond with a JSON object containing exactly these fields: ${schemaDescription}. Do not include any text outside the JSON object.`;

  const amendedUserPrompt = originalUserPrompt + strictReminder;

  try {
    const result = await generateText({
      model,
      output: Output.object({ schema }),
      system: systemPrompt,
      prompt: amendedUserPrompt,
      maxRetries: 3,
      abortSignal: options.signal,
    });

    const endTime = performance.now();
    const metadata = buildMetadata(result, modelId, startTime, endTime);

    return {
      output: result.output as T,
      metadata,
    };
  } catch (retryError: unknown) {
    if (NoObjectGeneratedError.isInstance(retryError)) {
      throw new TraditionCallError({
        tradition,
        cause: 'validation_failed',
        message: `Structured output validation failed after retry for ${tradition}`,
        rawResponse: retryError.text,
        model: modelId,
      });
    }

    throw new TraditionCallError({
      tradition,
      cause: 'provider_error',
      message: retryError instanceof Error ? retryError.message : 'Unknown provider error on retry',
      model: modelId,
    });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract a human-readable field description from a Zod schema.
 * Used in the strict retry reminder prompt.
 */
function describeSchemaFields(schema: z.ZodType<unknown>): string {
  // Access the shape if it's a ZodObject
  const def = (schema as { _def?: { shape?: () => Record<string, unknown> } })._def;
  if (def && typeof def.shape === 'function') {
    const shape = def.shape();
    return Object.keys(shape).join(', ');
  }
  // Fallback: we can't introspect the schema
  return '(see schema definition)';
}

/**
 * Build CallMetadata from an AI SDK generateText result.
 */
function buildMetadata(
  result: {
    usage: {
      inputTokens?: number | undefined;
      outputTokens?: number | undefined;
      inputTokenDetails?: { cacheReadTokens?: number | undefined };
    };
  },
  modelId: string,
  startTime: number,
  endTime: number,
): CallMetadata {
  const tokensIn = result.usage.inputTokens ?? 0;
  const tokensOut = result.usage.outputTokens ?? 0;
  const cachedTokensIn = result.usage.inputTokenDetails?.cacheReadTokens ?? 0;
  const latencyTotalMs = endTime - startTime;

  return {
    tokensIn,
    tokensOut,
    costUsd: calculateCost(modelId, tokensIn, tokensOut, cachedTokensIn),
    latencyFirstByteMs: latencyTotalMs, // Non-streaming: first byte = total
    latencyTotalMs,
    cacheHit: cachedTokensIn > 0,
    model: modelId,
  };
}
