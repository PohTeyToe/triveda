/**
 * Tests for SSE streaming utilities.
 *
 * All tests use mock mode (TRIVEDA_LLM_MODE=mock) to avoid real LLM
 * calls. Tests verify event ordering, event types, cancellation via
 * AbortSignal, error handling, and the non-streaming convenience wrapper.
 *
 * The orchestrator and mock-provider are mocked at the module level to
 * avoid pulling in the full LLM dependency chain (which has pre-existing
 * subpath resolution issues in some files).
 */

import { afterAll, beforeAll, describe, expect, it, mock } from 'bun:test';
import type {
  AyurvedaOutput,
  CallMetadata,
  DailyFoodInput,
  DailyFoodLLMResult,
  NaturopathyOutput,
  OrchestrationMetadata,
  SynthesisOutput,
  TCMOutput,
} from '@triveda/shared/src/llm/types.js';

// ---------------------------------------------------------------------------
// Mock fixtures (same shape as mock-provider.ts)
// ---------------------------------------------------------------------------

const MOCK_AYURVEDA: AyurvedaOutput = {
  rasa: 'Madhura (sweet)',
  virya: 'Sheeta (cooling)',
  vipaka: 'Madhura (sweet post-digestive)',
  doshaRationale: 'Oats are Guru (heavy) and Snigdha (oily), which directly ground Vata.',
  plainEnglish: 'Oats are grounding and cooling -- a good choice for Vata-dominant constitutions.',
};

const MOCK_TCM: TCMOutput = {
  thermal: 'Warm',
  element: 'Earth',
  organClock: 'Oats align with the Spleen-Stomach meridian pair (7-11 AM).',
  plainEnglish: 'From a Chinese medicine perspective, oats strengthen your digestive center.',
};

const MOCK_NATUROPATHY: NaturopathyOutput = {
  evidenceLevel: 'strong',
  pubmedCitations: [
    { claim: 'Beta-glucan in oats reduces LDL cholesterol', source: 'PMC4690088', year: 2016 },
  ],
  honestGaps: ['Long-term effects on gut microbiome diversity are understudied'],
  plainEnglish: 'Strong clinical evidence supports oats for cholesterol reduction.',
};

const MOCK_SYNTHESIS: SynthesisOutput = {
  convergenceFraming: 'All three traditions agree: oats are a supportive, grounding food.',
  twoSentenceRationale: 'Oats are a well-supported morning food across all three traditions.',
};

function buildMockCallMetadata(): CallMetadata {
  return {
    tokensIn: 1000,
    tokensOut: 300,
    costUsd: 0,
    latencyFirstByteMs: 0,
    latencyTotalMs: 0,
    cacheHit: false,
    model: 'claude-sonnet-4-6',
  };
}

function buildMockResult(): DailyFoodLLMResult {
  return {
    ayurveda: MOCK_AYURVEDA,
    tcm: MOCK_TCM,
    naturopathy: MOCK_NATUROPATHY,
    synthesis: MOCK_SYNTHESIS,
    metadata: {
      requestId: 'test-req-001',
      totalLatencyMs: 150,
      perTraditionLatency: { ayurveda: 50, tcm: 40, naturopathy: 30, synthesis: 30 },
      totalCostUsd: 0,
      perTraditionCost: { ayurveda: 0, tcm: 0, naturopathy: 0, synthesis: 0 },
      failedTraditions: [],
      degradationEvents: [],
      creditSources: [],
    },
  };
}

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

// Mock the broken transitive dependency first
mock.module('@triveda/shared/llm/types.js', () => {
  // Re-export from the correct path
  return require('@triveda/shared/src/llm/types.js');
});

mock.module('./mock-provider.js', () => ({
  isMockMode: () => true,
  getMockResponse: async <T>(tradition: string, _options?: { divergentSynthesis?: boolean }) => {
    const outputs: Record<string, unknown> = {
      ayurveda: MOCK_AYURVEDA,
      tcm: MOCK_TCM,
      naturopathy: MOCK_NATUROPATHY,
      synthesis: MOCK_SYNTHESIS,
    };
    return {
      output: outputs[tradition] as T,
      metadata: buildMockCallMetadata(),
    };
  },
}));

mock.module('./orchestrator.js', () => ({
  orchestrateDailyFood: async (_input: DailyFoodInput) => buildMockResult(),
}));

// Import AFTER mocks are set up
const streamingModule = await import('../streaming.js');
const { createSSEStream, createNonStreamingResponse } = streamingModule;

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeDailyFoodInput(overrides?: Partial<DailyFoodInput>): DailyFoodInput {
  return {
    requestId: 'test-req-001',
    userId: 'test-user-001',
    ayurveda: {
      foodProperties: {
        rasa: 'sweet',
        virya: 'cooling',
        vipaka: 'sweet',
        guna: ['guru', 'snigdha'],
        doshaEffects: { vata: -1, pitta: -1, kapha: 1 },
      },
      doshaProfile: { vata: 0.45, pitta: 0.35, kapha: 0.2 },
      seasonalContext: { currentRitu: 'vasanta', sandhiKala: false },
      weatherAggravation: { vata: 0.3, pitta: 0.2, kapha: 0.1 },
      recentFoodFeedback: [],
      creditSources: [],
    },
    tcm: {
      foodThermalNature: 'warm',
      flavors: ['sweet'],
      organAffinities: ['spleen', 'stomach'],
      fiveElementScores: { wood: 0.1, fire: 0.2, earth: 0.5, metal: 0.1, water: 0.1 },
      organClockHour: 9,
      dominantOrgan: 'spleen',
      userElementType: { wood: 0.4, fire: 0.3, earth: 0.15, metal: 0.1, water: 0.05 },
      seasonalTCMPhase: 'wood',
      creditSources: [],
    },
    naturopathy: {
      nutritionalData: {
        macros: { protein: 5, carbs: 27, fat: 3, fiber: 4 },
        keyMicronutrients: ['iron', 'magnesium'],
        glycemicIndex: 55,
      },
      bioactiveCompounds: [{ name: 'beta-glucan', amount: '4g' }],
      evidenceClaims: [{ claim: 'Lowers cholesterol', evidenceLevel: 'strong', source: 'PMC1234' }],
      creditSources: [],
    },
    synthesis: {
      ayurvedaOutput: null,
      tcmOutput: null,
      naturopathyOutput: null,
      convergenceFlag: true,
      convergenceDimensions: {
        thermal: 'agree',
        constitutional: 'agree',
        seasonal: 'neutral',
        evidence: 'agree',
      },
      selectedFoodName: 'Oatmeal',
      selectedFoodId: 'food-001',
      creditSources: [],
    },
    ...overrides,
  };
}

/**
 * Collect all events from the SSE stream into an array.
 */
interface SSEOutputEvent {
  event: string;
  data: unknown;
}

async function collectEvents(
  input: DailyFoodInput,
  options?: { signal?: AbortSignal },
): Promise<SSEOutputEvent[]> {
  const events: SSEOutputEvent[] = [];
  for await (const event of createSSEStream(input, options)) {
    events.push(event as SSEOutputEvent);
  }
  return events;
}

// ---------------------------------------------------------------------------
// Setup: ensure mock mode is active for all tests
// ---------------------------------------------------------------------------

let originalLLMMode: string | undefined;

beforeAll(() => {
  originalLLMMode = process.env.TRIVEDA_LLM_MODE;
  process.env.TRIVEDA_LLM_MODE = 'mock';
});

afterAll(() => {
  if (originalLLMMode !== undefined) {
    process.env.TRIVEDA_LLM_MODE = originalLLMMode;
  } else {
    process.env.TRIVEDA_LLM_MODE = undefined;
  }
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createSSEStream', () => {
  it('emits ayurveda_partial events during generation', async () => {
    const input = makeDailyFoodInput();
    const events = await collectEvents(input);

    const ayurvedaPartials = events.filter((e) => e.event === 'ayurveda_partial');
    expect(ayurvedaPartials.length).toBeGreaterThanOrEqual(1);

    // Partial data should have at least one field from AyurvedaOutput
    const firstPartial = ayurvedaPartials[0]?.data as Partial<AyurvedaOutput>;
    expect(firstPartial).toBeDefined();
    expect(Object.keys(firstPartial).length).toBeGreaterThanOrEqual(1);
  });

  it('emits tcm_partial events during generation', async () => {
    const input = makeDailyFoodInput();
    const events = await collectEvents(input);

    const tcmPartials = events.filter((e) => e.event === 'tcm_partial');
    expect(tcmPartials.length).toBeGreaterThanOrEqual(1);

    const firstPartial = tcmPartials[0]?.data as Partial<TCMOutput>;
    expect(firstPartial).toBeDefined();
    expect(Object.keys(firstPartial).length).toBeGreaterThanOrEqual(1);
  });

  it('emits naturopathy_partial events during generation', async () => {
    const input = makeDailyFoodInput();
    const events = await collectEvents(input);

    const naturopathyPartials = events.filter((e) => e.event === 'naturopathy_partial');
    expect(naturopathyPartials.length).toBeGreaterThanOrEqual(1);

    const firstPartial = naturopathyPartials[0]?.data as Partial<NaturopathyOutput>;
    expect(firstPartial).toBeDefined();
    expect(Object.keys(firstPartial).length).toBeGreaterThanOrEqual(1);
  });

  it('emits tradition_complete events with full validated output', async () => {
    const input = makeDailyFoodInput();
    const events = await collectEvents(input);

    const ayurvedaComplete = events.find((e) => e.event === 'ayurveda_complete');
    expect(ayurvedaComplete).toBeDefined();
    const ayurvedaData = ayurvedaComplete?.data as AyurvedaOutput;
    expect(ayurvedaData.rasa).toBeDefined();
    expect(ayurvedaData.virya).toBeDefined();
    expect(ayurvedaData.vipaka).toBeDefined();
    expect(ayurvedaData.doshaRationale).toBeDefined();
    expect(ayurvedaData.plainEnglish).toBeDefined();

    const tcmComplete = events.find((e) => e.event === 'tcm_complete');
    expect(tcmComplete).toBeDefined();
    const tcmData = tcmComplete?.data as TCMOutput;
    expect(tcmData.thermal).toBeDefined();
    expect(tcmData.element).toBeDefined();
    expect(tcmData.plainEnglish).toBeDefined();

    const naturopathyComplete = events.find((e) => e.event === 'naturopathy_complete');
    expect(naturopathyComplete).toBeDefined();
    const naturopathyData = naturopathyComplete?.data as NaturopathyOutput;
    expect(naturopathyData.evidenceLevel).toBeDefined();
    expect(naturopathyData.pubmedCitations).toBeDefined();
    expect(naturopathyData.plainEnglish).toBeDefined();
  });

  it('emits synthesis_complete event after traditions finish', async () => {
    const input = makeDailyFoodInput();
    const events = await collectEvents(input);

    const synthesisIdx = events.findIndex((e) => e.event === 'synthesis_complete');
    expect(synthesisIdx).not.toBe(-1);

    const synthesisData = events[synthesisIdx]?.data as SynthesisOutput;
    expect(synthesisData.convergenceFraming).toBeDefined();
    expect(synthesisData.twoSentenceRationale).toBeDefined();

    // Synthesis must come after all tradition_complete events
    const lastTraditionComplete = Math.max(
      events.findIndex((e) => e.event === 'ayurveda_complete'),
      events.findIndex((e) => e.event === 'tcm_complete'),
      events.findIndex((e) => e.event === 'naturopathy_complete'),
    );
    expect(synthesisIdx).toBeGreaterThan(lastTraditionComplete);
  });

  it('emits metadata event with cost/latency/request_id', async () => {
    const input = makeDailyFoodInput();
    const events = await collectEvents(input);

    const metadataEvent = events.find((e) => e.event === 'metadata');
    expect(metadataEvent).toBeDefined();

    const metadata = metadataEvent?.data as OrchestrationMetadata;
    expect(metadata.requestId).toBe('test-req-001');
    expect(typeof metadata.totalLatencyMs).toBe('number');
    expect(typeof metadata.totalCostUsd).toBe('number');
    expect(metadata.perTraditionLatency).toBeDefined();
    expect(metadata.perTraditionCost).toBeDefined();
  });

  it('emits done as the final event', async () => {
    const input = makeDailyFoodInput();
    const events = await collectEvents(input);

    expect(events.length).toBeGreaterThan(0);
    const lastEvent = events[events.length - 1];
    expect(lastEvent?.event).toBe('done');
    expect(lastEvent?.data).toEqual({});
  });

  it('stops generation when abort signal fires (client disconnect)', async () => {
    const input = makeDailyFoodInput();
    const controller = new AbortController();

    const events: SSEOutputEvent[] = [];
    let eventCount = 0;

    for await (const event of createSSEStream(input, { signal: controller.signal })) {
      events.push(event);
      eventCount++;
      // Abort after receiving the first event
      if (eventCount === 1) {
        controller.abort();
      }
    }

    // Should have stopped early -- fewer events than a full run
    const fullEvents = await collectEvents(makeDailyFoodInput());
    expect(events.length).toBeLessThan(fullEvents.length);
  });

  it('preserves correct event ordering: partials before complete, traditions before synthesis', async () => {
    const input = makeDailyFoodInput();
    const events = await collectEvents(input);
    const eventNames = events.map((e) => e.event);

    // For each tradition, partials must come before complete
    for (const tradition of ['ayurveda', 'tcm', 'naturopathy'] as const) {
      const partialIdx = eventNames.indexOf(`${tradition}_partial`);
      const completeIdx = eventNames.indexOf(`${tradition}_complete`);
      if (partialIdx !== -1 && completeIdx !== -1) {
        expect(partialIdx).toBeLessThan(completeIdx);
      }
    }

    // synthesis_complete must come after all tradition_complete events
    const synthesisIdx = eventNames.indexOf('synthesis_complete');
    const metadataIdx = eventNames.indexOf('metadata');
    const doneIdx = eventNames.indexOf('done');

    expect(synthesisIdx).not.toBe(-1);
    expect(metadataIdx).not.toBe(-1);
    expect(doneIdx).not.toBe(-1);

    // metadata after synthesis
    expect(metadataIdx).toBeGreaterThan(synthesisIdx);
    // done is last
    expect(doneIdx).toBe(events.length - 1);
  });

  it('emits all expected event types in a successful run', async () => {
    const input = makeDailyFoodInput();
    const events = await collectEvents(input);
    const eventTypes = new Set(events.map((e) => e.event));

    expect(eventTypes.has('ayurveda_partial')).toBe(true);
    expect(eventTypes.has('tcm_partial')).toBe(true);
    expect(eventTypes.has('naturopathy_partial')).toBe(true);
    expect(eventTypes.has('ayurveda_complete')).toBe(true);
    expect(eventTypes.has('tcm_complete')).toBe(true);
    expect(eventTypes.has('naturopathy_complete')).toBe(true);
    expect(eventTypes.has('synthesis_complete')).toBe(true);
    expect(eventTypes.has('metadata')).toBe(true);
    expect(eventTypes.has('done')).toBe(true);
  });
});

describe('createNonStreamingResponse', () => {
  it('returns same data structure as streaming would assemble', async () => {
    const input = makeDailyFoodInput();
    const result = await createNonStreamingResponse(input);

    expect(result.ayurveda).toBeDefined();
    expect(result.tcm).toBeDefined();
    expect(result.naturopathy).toBeDefined();
    expect(result.synthesis).toBeDefined();

    expect(result.metadata).toBeDefined();
    expect(result.metadata.requestId).toBe('test-req-001');
    expect(result.metadata.failedTraditions).toEqual([]);
  });

  it('returns AyurvedaOutput with all expected fields', async () => {
    const input = makeDailyFoodInput();
    const result = await createNonStreamingResponse(input);

    const ayurveda = result.ayurveda;
    expect(ayurveda).toBeDefined();
    expect(ayurveda?.rasa).toBeDefined();
    expect(ayurveda?.virya).toBeDefined();
    expect(ayurveda?.vipaka).toBeDefined();
    expect(ayurveda?.doshaRationale).toBeDefined();
    expect(ayurveda?.plainEnglish).toBeDefined();
  });

  it('returns SynthesisOutput with convergence framing', async () => {
    const input = makeDailyFoodInput();
    const result = await createNonStreamingResponse(input);

    const synthesis = result.synthesis;
    expect(synthesis).toBeDefined();
    expect(synthesis?.convergenceFraming).toBeDefined();
    expect(synthesis?.twoSentenceRationale).toBeDefined();
  });
});
