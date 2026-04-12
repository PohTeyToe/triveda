import { beforeEach, describe, expect, it, mock } from 'bun:test';

/**
 * Orchestrator tests.
 *
 * Mocks callWithFallback, mock-provider, prompt builders, and telemetry.
 * Verifies parallel execution, synthesis gating, metadata aggregation,
 * and mock mode behavior. No real LLM calls.
 */

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockAyurvedaOutput = {
  rasa: 'sweet',
  virya: 'cooling',
  vipaka: 'sweet',
  doshaRationale: 'Pacifies Vata.',
  plainEnglish: 'A grounding food.',
};

const mockTCMOutput = {
  thermal: 'Warm',
  element: 'Earth',
  organClock: 'Spleen-Stomach 7-11 AM.',
  plainEnglish: 'Supports digestion.',
};

const mockNaturopathyOutput = {
  evidenceLevel: 'strong' as const,
  pubmedCitations: [{ claim: 'Lowers cholesterol', source: 'PMC1234', year: 2020 }],
  honestGaps: ['Gut microbiome effects understudied'],
  plainEnglish: 'Strong evidence for cholesterol reduction.',
};

const mockSynthesisOutput = {
  convergenceFraming: 'All three traditions agree.',
  twoSentenceRationale: 'Oats are well-supported. Eat warm.',
};

const defaultMetadata = {
  tokensIn: 500,
  tokensOut: 100,
  costUsd: 0.003,
  latencyFirstByteMs: 200,
  latencyTotalMs: 200,
  cacheHit: false,
  model: 'claude-sonnet-4-6',
};

function buildTestInput() {
  return {
    requestId: 'req-test-001',
    userId: 'user-001',
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
      foodThermalNature: 'warm' as const,
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
        thermal: 'agree' as const,
        constitutional: 'agree' as const,
        seasonal: 'agree' as const,
        evidence: 'agree' as const,
      },
      selectedFoodName: 'Oatmeal',
      selectedFoodId: 'food-001',
      creditSources: [],
    },
  };
}

// ---------------------------------------------------------------------------
// Mock setup
// ---------------------------------------------------------------------------

class MockTraditionCallError extends Error {
  readonly tradition: string;
  readonly cause: string;
  readonly model: string;

  constructor(opts: { tradition: string; cause: string; message: string; model: string }) {
    super(opts.message);
    this.name = 'TraditionCallError';
    this.tradition = opts.tradition;
    this.cause = opts.cause;
    this.model = opts.model;
  }
}

// Track call order for parallel verification
let callTimestamps: Array<{ tradition: string; time: number }> = [];

const mockCallWithFallback = mock((tradition: string, ..._rest: unknown[]) => {
  callTimestamps.push({ tradition, time: performance.now() });
  const outputMap: Record<string, unknown> = {
    ayurveda: mockAyurvedaOutput,
    tcm: mockTCMOutput,
    naturopathy: mockNaturopathyOutput,
    synthesis: mockSynthesisOutput,
  };
  return Promise.resolve({
    output: outputMap[tradition],
    metadata: { ...defaultMetadata },
    fallbackUsed: false,
    degradationEvent: null as {
      tradition: string;
      model: string;
      errorType: string;
      timestamp: number;
      fallbackUsed: boolean;
      fallbackModel: string;
    } | null,
  });
});

const mockLogEntries: Array<{
  level: string;
  message: string;
  metadata?: Record<string, unknown>;
}> = [];

const mockLogger = {
  log: mock(async (level: string, message: string, metadata?: Record<string, unknown>) => {
    mockLogEntries.push({ level, message, metadata });
  }),
};

const mockGetMockResponse = mock((tradition: string) => {
  const outputMap: Record<string, unknown> = {
    ayurveda: mockAyurvedaOutput,
    tcm: mockTCMOutput,
    naturopathy: mockNaturopathyOutput,
    synthesis: mockSynthesisOutput,
  };
  return Promise.resolve({
    output: outputMap[tradition],
    metadata: { ...defaultMetadata, latencyTotalMs: 0, costUsd: 0 },
  });
});

let mockModeEnabled = false;

mock.module('@triveda/shared/llm/types.js', () => ({
  TraditionCallError: MockTraditionCallError,
  DEFAULT_PROVIDER_MAP: {
    ayurveda: {
      model: 'claude-sonnet-4-6',
      temperature: 0.3,
      maxTokens: 1024,
      provider: 'anthropic',
    },
    tcm: { model: 'claude-sonnet-4-6', temperature: 0.3, maxTokens: 1024, provider: 'anthropic' },
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
  },
}));

mock.module('@triveda/shared/llm/prompts/v1/schemas.js', () => ({
  ayurvedaOutputSchema: {},
  tcmOutputSchema: {},
  naturopathyOutputSchema: {},
  synthesisOutputSchema: {},
}));

mock.module('@triveda/shared/credits.js', () => ({
  mergeCredits: (sources: unknown[][]) => sources.flat(),
}));

mock.module('../../src/llm/fallback.js', () => ({
  callWithFallback: mockCallWithFallback,
}));

mock.module('../../src/llm/mock-provider.js', () => ({
  getMockResponse: mockGetMockResponse,
  isMockMode: () => mockModeEnabled,
}));

mock.module('../../src/llm/telemetry.js', () => ({
  getTelemetryLogger: () => mockLogger,
}));

// Mock prompt builders to return simple strings
mock.module('../../src/llm/prompts/index.js', () => ({
  buildAyurvedaSystemPrompt: () => 'ayurveda-system',
  buildAyurvedaUserPrompt: () => 'ayurveda-user',
  buildTCMSystemPrompt: () => 'tcm-system',
  buildTCMUserPrompt: () => 'tcm-user',
  buildNaturopathySystemPrompt: () => 'naturopathy-system',
  buildNaturopathyUserPrompt: () => 'naturopathy-user',
  buildSynthesisSystemPrompt: () => 'synthesis-system',
  buildSynthesisUserPrompt: () => 'synthesis-user',
}));

// Import after mocking
const { orchestrateDailyFood } = await import('../../src/llm/orchestrator.js');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('orchestrateDailyFood', () => {
  beforeEach(() => {
    mockCallWithFallback.mockClear();
    mockGetMockResponse.mockClear();
    mockLogger.log.mockClear();
    mockLogEntries.length = 0;
    callTimestamps = [];
    mockModeEnabled = false;

    // Reset to default success behavior
    mockCallWithFallback.mockImplementation((tradition: string, ..._rest: unknown[]) => {
      callTimestamps.push({ tradition, time: performance.now() });
      const outputMap: Record<string, unknown> = {
        ayurveda: mockAyurvedaOutput,
        tcm: mockTCMOutput,
        naturopathy: mockNaturopathyOutput,
        synthesis: mockSynthesisOutput,
      };
      return Promise.resolve({
        output: outputMap[tradition],
        metadata: { ...defaultMetadata },
        fallbackUsed: false,
        degradationEvent: null as {
          tradition: string;
          model: string;
          errorType: string;
          timestamp: number;
          fallbackUsed: boolean;
          fallbackModel: string;
        } | null,
      });
    });
  });

  // -----------------------------------------------------------------------
  // Happy path
  // -----------------------------------------------------------------------

  it('returns all four outputs on full success', async () => {
    const result = await orchestrateDailyFood(buildTestInput());

    expect(result.ayurveda).toEqual(mockAyurvedaOutput);
    expect(result.tcm).toEqual(mockTCMOutput);
    expect(result.naturopathy).toEqual(mockNaturopathyOutput);
    expect(result.synthesis).toEqual(mockSynthesisOutput);
  });

  it('calls three traditions then synthesis (4 total calls)', async () => {
    await orchestrateDailyFood(buildTestInput());

    expect(mockCallWithFallback).toHaveBeenCalledTimes(4);
  });

  it('calls synthesis after all three traditions complete', async () => {
    await orchestrateDailyFood(buildTestInput());

    // Synthesis should be the last call recorded
    const traditions = callTimestamps.map((c) => c.tradition);
    const synthIdx = traditions.lastIndexOf('synthesis');
    const maxTraditionIdx = Math.max(
      traditions.indexOf('ayurveda'),
      traditions.indexOf('tcm'),
      traditions.indexOf('naturopathy'),
    );
    expect(synthIdx).toBeGreaterThan(maxTraditionIdx);
  });

  it('generates consistent request ID across all calls', async () => {
    const input = buildTestInput();
    input.requestId = 'consistent-req-id';
    await orchestrateDailyFood(input);

    const calls = mockCallWithFallback.mock.calls;
    for (const call of calls) {
      const args = call as unknown[];
      const options = args[4] as { requestId: string };
      expect(options.requestId).toBe('consistent-req-id');
    }
  });

  it('uses the input requestId in metadata', async () => {
    const input = buildTestInput();
    input.requestId = 'my-request-id';
    const result = await orchestrateDailyFood(input);

    expect(result.metadata.requestId).toBe('my-request-id');
  });

  // -----------------------------------------------------------------------
  // Latency and cost aggregation
  // -----------------------------------------------------------------------

  it('returns per-tradition latency in metadata', async () => {
    mockCallWithFallback.mockImplementation((tradition: string, ..._rest: unknown[]) => {
      callTimestamps.push({ tradition, time: performance.now() });
      const latencyMap: Record<string, number> = {
        ayurveda: 100,
        tcm: 150,
        naturopathy: 200,
        synthesis: 50,
      };
      return Promise.resolve({
        output:
          tradition === 'synthesis'
            ? mockSynthesisOutput
            : tradition === 'ayurveda'
              ? mockAyurvedaOutput
              : tradition === 'tcm'
                ? mockTCMOutput
                : mockNaturopathyOutput,
        metadata: { ...defaultMetadata, latencyTotalMs: latencyMap[tradition] ?? 0 },
        fallbackUsed: false,
        degradationEvent: null,
      });
    });

    const result = await orchestrateDailyFood(buildTestInput());

    expect(result.metadata.perTraditionLatency.ayurveda).toBe(100);
    expect(result.metadata.perTraditionLatency.tcm).toBe(150);
    expect(result.metadata.perTraditionLatency.naturopathy).toBe(200);
    expect(result.metadata.perTraditionLatency.synthesis).toBe(50);
  });

  it('returns total cost summed across all calls', async () => {
    mockCallWithFallback.mockImplementation((tradition: string, ..._rest: unknown[]) => {
      callTimestamps.push({ tradition, time: performance.now() });
      const costMap: Record<string, number> = {
        ayurveda: 0.003,
        tcm: 0.003,
        naturopathy: 0.001,
        synthesis: 0.002,
      };
      return Promise.resolve({
        output:
          tradition === 'synthesis'
            ? mockSynthesisOutput
            : tradition === 'ayurveda'
              ? mockAyurvedaOutput
              : tradition === 'tcm'
                ? mockTCMOutput
                : mockNaturopathyOutput,
        metadata: { ...defaultMetadata, costUsd: costMap[tradition] ?? 0 },
        fallbackUsed: false,
        degradationEvent: null,
      });
    });

    const result = await orchestrateDailyFood(buildTestInput());

    const expectedTotal = 0.003 + 0.003 + 0.001 + 0.002;
    expect(result.metadata.totalCostUsd).toBeCloseTo(expectedTotal, 6);
    expect(result.metadata.perTraditionCost.ayurveda).toBe(0.003);
    expect(result.metadata.perTraditionCost.naturopathy).toBe(0.001);
  });

  it('returns totalLatencyMs covering full orchestration', async () => {
    const result = await orchestrateDailyFood(buildTestInput());

    expect(result.metadata.totalLatencyMs).toBeGreaterThanOrEqual(0);
    expect(typeof result.metadata.totalLatencyMs).toBe('number');
  });

  // -----------------------------------------------------------------------
  // Failure handling
  // -----------------------------------------------------------------------

  it('handles one tradition failure (other two + synthesis succeed)', async () => {
    mockCallWithFallback.mockImplementation((tradition: string, ..._rest: unknown[]) => {
      callTimestamps.push({ tradition, time: performance.now() });
      if (tradition === 'tcm') {
        return Promise.reject(new Error('TCM provider down'));
      }
      const outputMap: Record<string, unknown> = {
        ayurveda: mockAyurvedaOutput,
        naturopathy: mockNaturopathyOutput,
        synthesis: mockSynthesisOutput,
      };
      return Promise.resolve({
        output: outputMap[tradition],
        metadata: { ...defaultMetadata },
        fallbackUsed: false,
        degradationEvent: null,
      });
    });

    const result = await orchestrateDailyFood(buildTestInput());

    expect(result.ayurveda).toEqual(mockAyurvedaOutput);
    expect(result.tcm).toBeNull();
    expect(result.naturopathy).toEqual(mockNaturopathyOutput);
    // 2 succeeded, so synthesis still runs
    expect(result.synthesis).toEqual(mockSynthesisOutput);
    expect(result.metadata.failedTraditions).toContain('tcm');
    expect(result.metadata.failedTraditions).toHaveLength(1);
  });

  it('skips synthesis when two traditions fail', async () => {
    mockCallWithFallback.mockImplementation((tradition: string, ..._rest: unknown[]) => {
      callTimestamps.push({ tradition, time: performance.now() });
      if (tradition === 'tcm' || tradition === 'naturopathy') {
        return Promise.reject(new Error(`${tradition} provider down`));
      }
      const outputMap: Record<string, unknown> = {
        ayurveda: mockAyurvedaOutput,
        synthesis: mockSynthesisOutput,
      };
      return Promise.resolve({
        output: outputMap[tradition],
        metadata: { ...defaultMetadata },
        fallbackUsed: false,
        degradationEvent: null,
      });
    });

    const result = await orchestrateDailyFood(buildTestInput());

    expect(result.ayurveda).toEqual(mockAyurvedaOutput);
    expect(result.tcm).toBeNull();
    expect(result.naturopathy).toBeNull();
    expect(result.synthesis).toBeNull(); // Skipped -- only 1 succeeded
    expect(result.metadata.failedTraditions).toContain('tcm');
    expect(result.metadata.failedTraditions).toContain('naturopathy');
    // Synthesis was never called (only 3 tradition calls, not 4)
    expect(mockCallWithFallback).toHaveBeenCalledTimes(3);
  });

  it('handles all three failures (all null, no synthesis)', async () => {
    mockCallWithFallback.mockImplementation((tradition: string, ..._rest: unknown[]) => {
      callTimestamps.push({ tradition, time: performance.now() });
      return Promise.reject(new Error(`${tradition} provider down`));
    });

    const result = await orchestrateDailyFood(buildTestInput());

    expect(result.ayurveda).toBeNull();
    expect(result.tcm).toBeNull();
    expect(result.naturopathy).toBeNull();
    expect(result.synthesis).toBeNull();
    expect(result.metadata.failedTraditions).toHaveLength(3);
    expect(mockCallWithFallback).toHaveBeenCalledTimes(3);
  });

  it('returns failed traditions list in metadata', async () => {
    mockCallWithFallback.mockImplementation((tradition: string, ..._rest: unknown[]) => {
      callTimestamps.push({ tradition, time: performance.now() });
      if (tradition === 'ayurveda') {
        return Promise.reject(new Error('Ayurveda down'));
      }
      const outputMap: Record<string, unknown> = {
        tcm: mockTCMOutput,
        naturopathy: mockNaturopathyOutput,
        synthesis: mockSynthesisOutput,
      };
      return Promise.resolve({
        output: outputMap[tradition],
        metadata: { ...defaultMetadata },
        fallbackUsed: false,
        degradationEvent: null,
      });
    });

    const result = await orchestrateDailyFood(buildTestInput());

    expect(result.metadata.failedTraditions).toEqual(['ayurveda']);
  });

  it('collects degradation events in metadata', async () => {
    const degradationEvent = {
      tradition: 'ayurveda',
      model: 'claude-sonnet-4-6',
      errorType: 'provider_error',
      timestamp: Date.now(),
      fallbackUsed: true,
      fallbackModel: 'gemini-2.5-flash',
    };

    mockCallWithFallback.mockImplementation((tradition: string, ..._rest: unknown[]) => {
      callTimestamps.push({ tradition, time: performance.now() });
      return Promise.resolve({
        output:
          tradition === 'synthesis'
            ? mockSynthesisOutput
            : tradition === 'ayurveda'
              ? mockAyurvedaOutput
              : tradition === 'tcm'
                ? mockTCMOutput
                : mockNaturopathyOutput,
        metadata: { ...defaultMetadata },
        fallbackUsed: tradition === 'ayurveda',
        degradationEvent: tradition === 'ayurveda' ? degradationEvent : null,
      });
    });

    const result = await orchestrateDailyFood(buildTestInput());

    expect(result.metadata.degradationEvents).toHaveLength(1);
    const firstEvent = result.metadata.degradationEvents[0];
    expect(firstEvent?.tradition).toBe('ayurveda');
    expect(firstEvent?.fallbackModel).toBe('gemini-2.5-flash');
  });

  it('handles synthesis failure gracefully', async () => {
    mockCallWithFallback.mockImplementation((tradition: string, ..._rest: unknown[]) => {
      callTimestamps.push({ tradition, time: performance.now() });
      if (tradition === 'synthesis') {
        return Promise.reject(new Error('Synthesis failed'));
      }
      const outputMap: Record<string, unknown> = {
        ayurveda: mockAyurvedaOutput,
        tcm: mockTCMOutput,
        naturopathy: mockNaturopathyOutput,
      };
      return Promise.resolve({
        output: outputMap[tradition],
        metadata: { ...defaultMetadata },
        fallbackUsed: false,
        degradationEvent: null,
      });
    });

    const result = await orchestrateDailyFood(buildTestInput());

    expect(result.ayurveda).toEqual(mockAyurvedaOutput);
    expect(result.tcm).toEqual(mockTCMOutput);
    expect(result.naturopathy).toEqual(mockNaturopathyOutput);
    expect(result.synthesis).toBeNull();
    expect(result.metadata.failedTraditions).toContain('synthesis');
  });

  // -----------------------------------------------------------------------
  // Mock mode
  // -----------------------------------------------------------------------

  it('uses mock provider in mock mode', async () => {
    mockModeEnabled = true;

    const result = await orchestrateDailyFood(buildTestInput());

    expect(mockGetMockResponse).toHaveBeenCalledTimes(4);
    expect(mockCallWithFallback).not.toHaveBeenCalled();
    expect(result.ayurveda).toEqual(mockAyurvedaOutput);
    expect(result.tcm).toEqual(mockTCMOutput);
    expect(result.naturopathy).toEqual(mockNaturopathyOutput);
    expect(result.synthesis).toEqual(mockSynthesisOutput);
    expect(result.metadata.totalCostUsd).toBe(0);
    expect(result.metadata.failedTraditions).toHaveLength(0);
  });

  it('mock mode returns zero cost', async () => {
    mockModeEnabled = true;

    const result = await orchestrateDailyFood(buildTestInput());

    expect(result.metadata.totalCostUsd).toBe(0);
    expect(result.metadata.perTraditionCost.ayurveda).toBe(0);
    expect(result.metadata.perTraditionCost.tcm).toBe(0);
    expect(result.metadata.perTraditionCost.naturopathy).toBe(0);
    expect(result.metadata.perTraditionCost.synthesis).toBe(0);
  });

  // -----------------------------------------------------------------------
  // Parallel execution verification
  // -----------------------------------------------------------------------

  it('calls three traditions concurrently (not sequentially)', async () => {
    // Add artificial delay to each tradition call
    const DELAY_MS = 50;

    mockCallWithFallback.mockImplementation((tradition: string, ..._rest: unknown[]) => {
      callTimestamps.push({ tradition, time: performance.now() });

      return new Promise((resolve) => {
        setTimeout(() => {
          const outputMap: Record<string, unknown> = {
            ayurveda: mockAyurvedaOutput,
            tcm: mockTCMOutput,
            naturopathy: mockNaturopathyOutput,
            synthesis: mockSynthesisOutput,
          };
          resolve({
            output: outputMap[tradition],
            metadata: { ...defaultMetadata },
            fallbackUsed: false,
            degradationEvent: null,
          });
        }, DELAY_MS);
      });
    });

    const start = performance.now();
    await orchestrateDailyFood(buildTestInput());
    const totalMs = performance.now() - start;

    // If sequential: 50ms * 4 = 200ms+ minimum
    // If parallel traditions + sequential synthesis: ~100ms (50ms parallel + 50ms synthesis)
    // Allow some margin but it should be well under 200ms
    expect(totalMs).toBeLessThan(200);
  });
});
