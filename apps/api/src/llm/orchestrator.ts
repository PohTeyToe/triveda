/**
 * Daily food orchestrator -- coordinates all LLM calls for a daily
 * food recommendation.
 *
 * Runs three tradition calls (Ayurveda, TCM, Naturopathy) in parallel
 * via Promise.allSettled, then runs synthesis sequentially with the
 * deterministic convergence flag injected.
 *
 * Each tradition call is wrapped in fallback/circuit breaker logic.
 * In mock mode (TRIVEDA_LLM_MODE=mock), uses mock-provider fixtures
 * instead of real LLM calls.
 *
 * Depends on: tradition-caller, fallback, mock-provider, prompts
 */

import { type CreditSource, mergeCredits } from '@triveda/shared/src/credits.js';
import {
  type AyurvedaSchemaOutput,
  type NaturopathySchemaOutput,
  type SynthesisSchemaOutput,
  type TCMSchemaOutput,
  ayurvedaOutputSchema,
  naturopathyOutputSchema,
  synthesisOutputSchema,
  tcmOutputSchema,
} from '@triveda/shared/src/llm/prompts/v1/schemas.js';
import type {
  AyurvedaOutput,
  CallMetadata,
  DailyFoodInput,
  DailyFoodLLMResult,
  NaturopathyOutput,
  OrchestrationMetadata,
  ProviderDegradationEvent,
  SynthesisOutput,
  TCMOutput,
  TraditionType,
} from '@triveda/shared/src/llm/types.js';

import { type FallbackResult, callWithFallback } from './fallback.js';
import { getMockResponse, isMockMode } from './mock-provider.js';
import {
  buildAyurvedaSystemPrompt,
  buildAyurvedaUserPrompt,
  buildNaturopathySystemPrompt,
  buildNaturopathyUserPrompt,
  buildSynthesisSystemPrompt,
  buildSynthesisUserPrompt,
  buildTCMSystemPrompt,
  buildTCMUserPrompt,
} from './prompts/index.js';
import { getTelemetryLogger } from './telemetry.js';
import type { CallOptions } from './tradition-caller.js';

// ---------------------------------------------------------------------------
// orchestrateDailyFood
// ---------------------------------------------------------------------------

/**
 * Orchestrate the full daily food LLM pipeline.
 *
 * Steps:
 * 1. Setup: generate request ID, record start time
 * 2. Build prompts for each tradition
 * 3. Run three tradition calls in parallel (Promise.allSettled)
 * 4. Run synthesis if at least two traditions succeeded
 * 5. Assemble DailyFoodLLMResult with metadata
 *
 * In mock mode, returns fixture data with zero latency and cost.
 */
export async function orchestrateDailyFood(input: DailyFoodInput): Promise<DailyFoodLLMResult> {
  const logger = getTelemetryLogger();
  const startTime = performance.now();
  const requestId = input.requestId;

  // -----------------------------------------------------------------------
  // Mock mode: return fixtures immediately
  // -----------------------------------------------------------------------

  if (isMockMode()) {
    return orchestrateMock(input, requestId, startTime);
  }

  // -----------------------------------------------------------------------
  // Build call options
  // -----------------------------------------------------------------------

  const callOptions: CallOptions = {
    requestId,
    userId: input.userId,
    foodId: input.synthesis.selectedFoodId,
    promptVersion: 'v1',
  };

  // -----------------------------------------------------------------------
  // Step 2: Build prompts
  // -----------------------------------------------------------------------

  const ayurvedaSystemPrompt = buildAyurvedaSystemPrompt({
    foodName: input.synthesis.selectedFoodName,
    rasa: input.ayurveda.foodProperties.rasa,
    virya: input.ayurveda.foodProperties.virya,
    vipaka: input.ayurveda.foodProperties.vipaka,
    guna: input.ayurveda.foodProperties.guna,
    doshaEffects: input.ayurveda.foodProperties.doshaEffects,
    seasonalFitScores: {},
  });
  const ayurvedaUserPrompt = buildAyurvedaUserPrompt(input.ayurveda);

  const tcmSystemPrompt = buildTCMSystemPrompt({
    foodName: input.synthesis.selectedFoodName,
    thermalNature: input.tcm.foodThermalNature,
    flavors: input.tcm.flavors,
    organAffinities: input.tcm.organAffinities,
    elementFitScores: input.tcm.fiveElementScores,
  });
  const tcmUserPrompt = buildTCMUserPrompt(input.tcm);

  const naturopathySystemPrompt = buildNaturopathySystemPrompt({
    foodName: input.synthesis.selectedFoodName,
    nutritionalData: input.naturopathy.nutritionalData,
    bioactiveCompounds: input.naturopathy.bioactiveCompounds,
    evidenceClaims: input.naturopathy.evidenceClaims,
  });
  const naturopathyUserPrompt = buildNaturopathyUserPrompt(input.naturopathy);

  // -----------------------------------------------------------------------
  // Step 3: Parallel tradition calls
  // -----------------------------------------------------------------------

  const [ayurvedaSettled, tcmSettled, naturopathySettled] = await Promise.allSettled([
    callWithFallback<AyurvedaSchemaOutput>(
      'ayurveda',
      ayurvedaSystemPrompt,
      ayurvedaUserPrompt,
      ayurvedaOutputSchema,
      callOptions,
    ),
    callWithFallback<TCMSchemaOutput>(
      'tcm',
      tcmSystemPrompt,
      tcmUserPrompt,
      tcmOutputSchema,
      callOptions,
    ),
    callWithFallback<NaturopathySchemaOutput>(
      'naturopathy',
      naturopathySystemPrompt,
      naturopathyUserPrompt,
      naturopathyOutputSchema,
      callOptions,
    ),
  ]);

  // -----------------------------------------------------------------------
  // Process tradition results
  // -----------------------------------------------------------------------

  const failedTraditions: TraditionType[] = [];
  const degradationEvents: ProviderDegradationEvent[] = [];
  const perTraditionLatency: Record<TraditionType, number> = {
    ayurveda: 0,
    tcm: 0,
    naturopathy: 0,
    synthesis: 0,
  };
  const perTraditionCost: Record<TraditionType, number> = {
    ayurveda: 0,
    tcm: 0,
    naturopathy: 0,
    synthesis: 0,
  };

  // Note: Schema outputs use snake_case field names (dosha_rationale, plain_english)
  // while the TS interfaces use camelCase. The cast below is safe because
  // callTradition already performs `result.output as T`. The API layer (split 06)
  // handles any field name transformation needed for the frontend.
  let ayurvedaOutput: AyurvedaOutput | null = null;
  let tcmOutput: TCMOutput | null = null;
  let naturopathyOutput: NaturopathyOutput | null = null;

  // Process ayurveda
  if (ayurvedaSettled.status === 'fulfilled') {
    const result = ayurvedaSettled.value;
    ayurvedaOutput = result.output as unknown as AyurvedaOutput;
    perTraditionLatency.ayurveda = result.metadata.latencyTotalMs;
    perTraditionCost.ayurveda = result.metadata.costUsd;
    if (result.degradationEvent) {
      degradationEvents.push(result.degradationEvent);
    }
  } else {
    failedTraditions.push('ayurveda');
    logTraditionFailure(logger, 'ayurveda', requestId, ayurvedaSettled.reason);
  }

  // Process TCM
  if (tcmSettled.status === 'fulfilled') {
    const result = tcmSettled.value;
    tcmOutput = result.output as unknown as TCMOutput;
    perTraditionLatency.tcm = result.metadata.latencyTotalMs;
    perTraditionCost.tcm = result.metadata.costUsd;
    if (result.degradationEvent) {
      degradationEvents.push(result.degradationEvent);
    }
  } else {
    failedTraditions.push('tcm');
    logTraditionFailure(logger, 'tcm', requestId, tcmSettled.reason);
  }

  // Process naturopathy
  if (naturopathySettled.status === 'fulfilled') {
    const result = naturopathySettled.value;
    naturopathyOutput = result.output as unknown as NaturopathyOutput;
    perTraditionLatency.naturopathy = result.metadata.latencyTotalMs;
    perTraditionCost.naturopathy = result.metadata.costUsd;
    if (result.degradationEvent) {
      degradationEvents.push(result.degradationEvent);
    }
  } else {
    failedTraditions.push('naturopathy');
    logTraditionFailure(logger, 'naturopathy', requestId, naturopathySettled.reason);
  }

  // -----------------------------------------------------------------------
  // Step 4: Synthesis (only if >= 2 traditions succeeded)
  // -----------------------------------------------------------------------

  const succeededCount = 3 - failedTraditions.length;
  let synthesisOutput: SynthesisOutput | null = null;

  if (succeededCount >= 2) {
    const synthesisInput = {
      ...input.synthesis,
      ayurvedaOutput,
      tcmOutput,
      naturopathyOutput,
    };

    const synthesisSystemPrompt = buildSynthesisSystemPrompt();
    const synthesisUserPrompt = buildSynthesisUserPrompt(synthesisInput);

    try {
      const synthesisResult = await callWithFallback<SynthesisSchemaOutput>(
        'synthesis',
        synthesisSystemPrompt,
        synthesisUserPrompt,
        synthesisOutputSchema,
        callOptions,
      );
      synthesisOutput = synthesisResult.output as unknown as SynthesisOutput;
      perTraditionLatency.synthesis = synthesisResult.metadata.latencyTotalMs;
      perTraditionCost.synthesis = synthesisResult.metadata.costUsd;
      if (synthesisResult.degradationEvent) {
        degradationEvents.push(synthesisResult.degradationEvent);
      }
    } catch (synthError: unknown) {
      failedTraditions.push('synthesis');
      logTraditionFailure(logger, 'synthesis', requestId, synthError);
    }
  } else {
    // Skip synthesis -- not enough tradition data
    logger
      .log('info', 'synthesis_skipped', {
        requestId,
        succeededCount,
        failedTraditions,
      })
      .catch(() => {});
  }

  // -----------------------------------------------------------------------
  // Step 5: Assemble result
  // -----------------------------------------------------------------------

  const endTime = performance.now();
  const totalLatencyMs = endTime - startTime;

  const totalCostUsd =
    (perTraditionCost.ayurveda ?? 0) +
    (perTraditionCost.tcm ?? 0) +
    (perTraditionCost.naturopathy ?? 0) +
    (perTraditionCost.synthesis ?? 0);

  const creditSources = mergeCredits([
    input.ayurveda.creditSources,
    input.tcm.creditSources,
    input.naturopathy.creditSources,
    input.synthesis.creditSources,
  ]);

  const metadata: OrchestrationMetadata = {
    requestId,
    totalLatencyMs,
    perTraditionLatency,
    totalCostUsd,
    perTraditionCost,
    failedTraditions,
    degradationEvents,
    creditSources,
  };

  return {
    ayurveda: ayurvedaOutput,
    tcm: tcmOutput,
    naturopathy: naturopathyOutput,
    synthesis: synthesisOutput,
    metadata,
  };
}

// ---------------------------------------------------------------------------
// Mock mode orchestration
// ---------------------------------------------------------------------------

async function orchestrateMock(
  input: DailyFoodInput,
  requestId: string,
  startTime: number,
): Promise<DailyFoodLLMResult> {
  const [ayurvedaResult, tcmResult, naturopathyResult, synthesisResult] = await Promise.all([
    getMockResponse<AyurvedaOutput>('ayurveda'),
    getMockResponse<TCMOutput>('tcm'),
    getMockResponse<NaturopathyOutput>('naturopathy'),
    getMockResponse<SynthesisOutput>('synthesis', {
      divergentSynthesis: !input.synthesis.convergenceFlag,
    }),
  ]);

  const endTime = performance.now();

  const creditSources = mergeCredits([
    input.ayurveda.creditSources,
    input.tcm.creditSources,
    input.naturopathy.creditSources,
    input.synthesis.creditSources,
  ]);

  const metadata: OrchestrationMetadata = {
    requestId,
    totalLatencyMs: endTime - startTime,
    perTraditionLatency: {
      ayurveda: ayurvedaResult.metadata.latencyTotalMs,
      tcm: tcmResult.metadata.latencyTotalMs,
      naturopathy: naturopathyResult.metadata.latencyTotalMs,
      synthesis: synthesisResult.metadata.latencyTotalMs,
    },
    totalCostUsd: 0,
    perTraditionCost: { ayurveda: 0, tcm: 0, naturopathy: 0, synthesis: 0 },
    failedTraditions: [],
    degradationEvents: [],
    creditSources,
  };

  return {
    ayurveda: ayurvedaResult.output,
    tcm: tcmResult.output,
    naturopathy: naturopathyResult.output,
    synthesis: synthesisResult.output,
    metadata,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function logTraditionFailure(
  logger: ReturnType<typeof getTelemetryLogger>,
  tradition: TraditionType,
  requestId: string,
  error: unknown,
): void {
  logger
    .log('error', 'tradition_call_failed', {
      tradition,
      requestId,
      error: error instanceof Error ? error.message : String(error),
    })
    .catch(() => {
      // fire-and-forget
    });
}
