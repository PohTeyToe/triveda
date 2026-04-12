/**
 * SSE streaming utilities for the daily food orchestration pipeline.
 *
 * Transforms the orchestrator's output into a stream of SSE events
 * consumable by Hono's streamSSE helper. Also provides a non-streaming
 * convenience wrapper for clients that do not support EventSource.
 *
 * Event protocol:
 *   - tradition_partial events carry progressively-parsed partial objects
 *   - tradition_complete events carry final Zod-validated objects
 *   - synthesis_complete carries the merged synthesis output
 *   - metadata carries cost/latency/request_id
 *   - error carries per-tradition failure info (does not stop the stream)
 *   - done is always the final event
 *
 * Depends on: orchestrator (orchestrateDailyFood), mock-provider
 */

import type {
  AyurvedaOutput,
  CallMetadata,
  DailyFoodInput,
  DailyFoodLLMResult,
  NaturopathyOutput,
  OrchestrationMetadata,
  SynthesisOutput,
  TCMOutput,
  TraditionType,
} from '@triveda/shared/src/llm/types.js';

import { getMockResponse, isMockMode } from './mock-provider.js';
import { orchestrateDailyFood } from './orchestrator.js';

// ---------------------------------------------------------------------------
// Internal stream event types (not exported -- implementation detail)
// ---------------------------------------------------------------------------

type StreamEvent =
  | { type: 'tradition_partial'; tradition: TraditionType; partial: Record<string, unknown> }
  | {
      type: 'tradition_complete';
      tradition: TraditionType;
      output: unknown;
      metadata: CallMetadata;
    }
  | { type: 'tradition_error'; tradition: TraditionType; error: string }
  | { type: 'synthesis_complete'; output: SynthesisOutput; metadata: CallMetadata }
  | { type: 'metadata'; data: OrchestrationMetadata }
  | { type: 'done' };

// ---------------------------------------------------------------------------
// SSE output event types (the public contract for Hono/frontend)
// ---------------------------------------------------------------------------

export type SSEOutputEvent =
  | { event: 'ayurveda_partial'; data: Partial<AyurvedaOutput> }
  | { event: 'tcm_partial'; data: Partial<TCMOutput> }
  | { event: 'naturopathy_partial'; data: Partial<NaturopathyOutput> }
  | { event: 'ayurveda_complete'; data: AyurvedaOutput }
  | { event: 'tcm_complete'; data: TCMOutput }
  | { event: 'naturopathy_complete'; data: NaturopathyOutput }
  | { event: 'synthesis_complete'; data: SynthesisOutput }
  | { event: 'metadata'; data: OrchestrationMetadata }
  | { event: 'error'; data: { tradition: string; message: string } }
  | { event: 'done'; data: Record<string, never> };

// ---------------------------------------------------------------------------
// Transform internal StreamEvent -> SSEOutputEvent
// ---------------------------------------------------------------------------

function transformToSSE(event: StreamEvent): SSEOutputEvent {
  switch (event.type) {
    case 'tradition_partial': {
      const eventName = `${event.tradition}_partial` as SSEOutputEvent['event'];
      return { event: eventName, data: event.partial } as SSEOutputEvent;
    }
    case 'tradition_complete': {
      const eventName = `${event.tradition}_complete` as SSEOutputEvent['event'];
      return { event: eventName, data: event.output } as SSEOutputEvent;
    }
    case 'tradition_error':
      return {
        event: 'error',
        data: { tradition: event.tradition, message: event.error },
      };
    case 'synthesis_complete':
      return { event: 'synthesis_complete', data: event.output };
    case 'metadata':
      return { event: 'metadata', data: event.data };
    case 'done':
      return { event: 'done', data: {} as Record<string, never> };
  }
}

// ---------------------------------------------------------------------------
// Mock stream generator
// ---------------------------------------------------------------------------

/** Default simulated delay per event in mock mode (ms). */
const MOCK_STREAM_DELAY_MS = 50;

/**
 * Yield a sequence of mock events that simulate a real streaming response.
 * Emits partial events (simulating progressive parsing), then complete
 * events, then synthesis, metadata, and done.
 */
async function* mockStreamEvents(
  input: DailyFoodInput,
  signal?: AbortSignal,
): AsyncGenerator<StreamEvent> {
  const traditions: Array<'ayurveda' | 'tcm' | 'naturopathy'> = ['ayurveda', 'tcm', 'naturopathy'];

  const mockResults: Record<string, { output: unknown; metadata: CallMetadata }> = {};

  // Fetch all mock outputs up front
  for (const tradition of traditions) {
    if (signal?.aborted) return;
    const result = await getMockResponse(tradition);
    mockResults[tradition] = result;
  }

  // Emit partial + complete for each tradition
  for (const tradition of traditions) {
    if (signal?.aborted) return;
    const result = mockResults[tradition];
    if (!result) continue;

    // Emit a partial with a subset of fields
    const partialFields = Object.keys(result.output as Record<string, unknown>);
    const partial: Record<string, unknown> = {};
    if (partialFields.length > 0) {
      const firstField = partialFields[0] as string;
      partial[firstField] = (result.output as Record<string, unknown>)[firstField];
    }

    yield { type: 'tradition_partial', tradition, partial };
    await delay(MOCK_STREAM_DELAY_MS, signal);

    // Emit another partial with more fields
    if (partialFields.length > 1) {
      for (let i = 1; i < partialFields.length; i++) {
        const field = partialFields[i] as string;
        partial[field] = (result.output as Record<string, unknown>)[field];
      }
      yield { type: 'tradition_partial', tradition, partial };
      await delay(MOCK_STREAM_DELAY_MS, signal);
    }

    // Emit complete
    yield {
      type: 'tradition_complete',
      tradition,
      output: result.output,
      metadata: result.metadata,
    };
    await delay(MOCK_STREAM_DELAY_MS, signal);
  }

  // Synthesis
  if (signal?.aborted) return;
  const synthesisResult = await getMockResponse<SynthesisOutput>('synthesis', {
    divergentSynthesis: !input.synthesis.convergenceFlag,
  });

  yield {
    type: 'synthesis_complete',
    output: synthesisResult.output,
    metadata: synthesisResult.metadata,
  };
  await delay(MOCK_STREAM_DELAY_MS, signal);

  // Metadata
  if (signal?.aborted) return;
  const metadata: OrchestrationMetadata = {
    requestId: input.requestId,
    totalLatencyMs: MOCK_STREAM_DELAY_MS * traditions.length * 3 + MOCK_STREAM_DELAY_MS,
    perTraditionLatency: { ayurveda: 0, tcm: 0, naturopathy: 0, synthesis: 0 },
    totalCostUsd: 0,
    perTraditionCost: { ayurveda: 0, tcm: 0, naturopathy: 0, synthesis: 0 },
    failedTraditions: [],
    degradationEvents: [],
    creditSources: [],
  };
  yield { type: 'metadata', data: metadata };
  await delay(MOCK_STREAM_DELAY_MS, signal);

  // Done
  yield { type: 'done' };
}

// ---------------------------------------------------------------------------
// Live stream generator (wraps orchestrateDailyFood results as events)
// ---------------------------------------------------------------------------

/**
 * Produce a stream of internal StreamEvents from the non-streaming
 * orchestrator. Since the current orchestrator (Section 04) does not
 * natively stream partial objects, this wrapper emits:
 *   1. tradition_complete for each succeeded tradition
 *   2. tradition_error for each failed tradition
 *   3. synthesis_complete if synthesis succeeded
 *   4. metadata with the full OrchestrationMetadata
 *   5. done
 *
 * When a true streaming orchestrator (orchestrateDailyFoodStream) is
 * available, this function should be replaced to yield partial events
 * as the LLM generates tokens.
 */
async function* liveStreamEvents(
  input: DailyFoodInput,
  signal?: AbortSignal,
): AsyncGenerator<StreamEvent> {
  // Run the full orchestration (parallel traditions + synthesis)
  const result = await orchestrateDailyFood(input);

  // Check abort after the await
  if (signal?.aborted) return;

  // Emit tradition results
  const traditions: Array<{ key: 'ayurveda' | 'tcm' | 'naturopathy'; output: unknown }> = [
    { key: 'ayurveda', output: result.ayurveda },
    { key: 'tcm', output: result.tcm },
    { key: 'naturopathy', output: result.naturopathy },
  ];

  for (const { key, output } of traditions) {
    if (signal?.aborted) return;

    if (output !== null) {
      const tradition = key as TraditionType;
      yield {
        type: 'tradition_complete',
        tradition,
        output,
        metadata: {
          tokensIn: 0,
          tokensOut: 0,
          costUsd: result.metadata.perTraditionCost[tradition],
          latencyFirstByteMs: result.metadata.perTraditionLatency[tradition],
          latencyTotalMs: result.metadata.perTraditionLatency[tradition],
          cacheHit: false,
          model: '',
        },
      };
    } else if (result.metadata.failedTraditions.includes(key)) {
      yield {
        type: 'tradition_error',
        tradition: key,
        error: `${key} call failed`,
      };
    }
  }

  // Synthesis
  if (signal?.aborted) return;
  if (result.synthesis !== null) {
    yield {
      type: 'synthesis_complete',
      output: result.synthesis,
      metadata: {
        tokensIn: 0,
        tokensOut: 0,
        costUsd: result.metadata.perTraditionCost.synthesis,
        latencyFirstByteMs: result.metadata.perTraditionLatency.synthesis,
        latencyTotalMs: result.metadata.perTraditionLatency.synthesis,
        cacheHit: false,
        model: '',
      },
    };
  }

  // Metadata
  if (signal?.aborted) return;
  yield { type: 'metadata', data: result.metadata };

  // Done
  yield { type: 'done' };
}

// ---------------------------------------------------------------------------
// createSSEStream (public API)
// ---------------------------------------------------------------------------

/**
 * Create an async generator of SSE output events for a daily food request.
 *
 * In mock mode, emits simulated events with delays. In live mode, wraps
 * the orchestrator result into a sequence of SSE events.
 *
 * Usage with Hono:
 * ```ts
 * streamSSE(c, async (stream) => {
 *   for await (const event of createSSEStream(input, { signal: c.req.raw.signal })) {
 *     await stream.writeSSE({ event: event.event, data: JSON.stringify(event.data) });
 *   }
 * });
 * ```
 */
export async function* createSSEStream(
  input: DailyFoodInput,
  options?: { signal?: AbortSignal },
): AsyncGenerator<SSEOutputEvent> {
  const signal = options?.signal;

  const source = isMockMode() ? mockStreamEvents(input, signal) : liveStreamEvents(input, signal);

  try {
    for await (const event of source) {
      if (signal?.aborted) return;
      yield transformToSSE(event);
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      // Client disconnected -- clean exit
      return;
    }
    // Emit an error event, then done, then stop
    yield {
      event: 'error',
      data: {
        tradition: 'unknown',
        message: error instanceof Error ? error.message : 'Unknown streaming error',
      },
    };
    yield { event: 'done', data: {} as Record<string, never> };
  }
}

// ---------------------------------------------------------------------------
// createNonStreamingResponse (public API)
// ---------------------------------------------------------------------------

/**
 * Convenience wrapper for clients that do not support SSE.
 *
 * Returns the same DailyFoodLLMResult as the streaming version would
 * assemble, but without streaming. Uses orchestrateDailyFood directly.
 */
export async function createNonStreamingResponse(
  input: DailyFoodInput,
): Promise<DailyFoodLLMResult> {
  return orchestrateDailyFood(input);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Delay that respects an abort signal. Resolves immediately if the
 * signal is already aborted.
 */
function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}
