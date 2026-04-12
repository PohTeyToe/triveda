import { beforeEach, describe, expect, it, mock } from 'bun:test';

/**
 * Fallback + circuit breaker tests.
 *
 * Uses Bun's mock system to stub callTradition from tradition-caller
 * and telemetry logger. No real LLM calls are made.
 */

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const validAyurvedaOutput = {
  rasa: 'sweet',
  virya: 'cooling',
  vipaka: 'sweet',
  dosha_rationale: 'Pacifies Vata.',
  plain_english: 'A grounding food.',
};

const validMetadata = {
  tokensIn: 500,
  tokensOut: 100,
  costUsd: 0.003,
  latencyFirstByteMs: 200,
  latencyTotalMs: 200,
  cacheHit: false,
  model: 'claude-sonnet-4-6',
};

const defaultCallOptions = {
  requestId: 'req-001',
  userId: 'user-001',
  foodId: 'food-001',
  promptVersion: 'v1',
};

// ---------------------------------------------------------------------------
// Mock setup
// ---------------------------------------------------------------------------

class MockTraditionCallError extends Error {
  readonly tradition: string;
  readonly cause: string;
  readonly rawResponse: string | undefined;
  readonly zodError: unknown;
  readonly model: string;

  constructor(opts: {
    tradition: string;
    cause: string;
    message: string;
    rawResponse?: string;
    zodError?: unknown;
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

const mockCallTradition = mock(() =>
  Promise.resolve({
    output: validAyurvedaOutput,
    metadata: { ...validMetadata },
  }),
);

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

// Register mocks before importing
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

mock.module('../../src/llm/tradition-caller.js', () => ({
  callTradition: mockCallTradition,
}));

mock.module('../../src/llm/telemetry.js', () => ({
  getTelemetryLogger: () => mockLogger,
}));

// Import after mocking
const { CircuitBreaker, callWithFallback, getCircuitBreaker, resetAllCircuitBreakers } =
  await import('../../src/llm/fallback.js');

// ---------------------------------------------------------------------------
// Circuit breaker tests
// ---------------------------------------------------------------------------

describe('CircuitBreaker', () => {
  let cb: InstanceType<typeof CircuitBreaker>;

  beforeEach(() => {
    cb = new CircuitBreaker({ failureThreshold: 5, resetTimeoutMs: 30_000 });
  });

  it('starts in closed state', () => {
    expect(cb.getState()).toBe('closed');
    expect(cb.shouldSkipPrimary()).toBe(false);
  });

  it('stays closed after fewer than threshold failures', () => {
    for (let i = 0; i < 4; i++) {
      cb.recordFailure();
    }
    expect(cb.getState()).toBe('closed');
    expect(cb.shouldSkipPrimary()).toBe(false);
  });

  it('opens after 5 consecutive failures', () => {
    for (let i = 0; i < 5; i++) {
      cb.recordFailure();
    }
    expect(cb.getState()).toBe('open');
    expect(cb.shouldSkipPrimary()).toBe(true);
  });

  it('transitions to half-open after cooldown expires', () => {
    // Use a very short cooldown for testing
    const fastCb = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 1 });
    fastCb.recordFailure();
    fastCb.recordFailure();
    expect(fastCb.getState()).toBe('open');
    expect(fastCb.shouldSkipPrimary()).toBe(true);

    // Wait for cooldown (1ms)
    const start = Date.now();
    while (Date.now() - start < 5) {
      // busy wait
    }

    // After cooldown, shouldSkipPrimary should return false (half-open)
    expect(fastCb.shouldSkipPrimary()).toBe(false);
    expect(fastCb.getState()).toBe('half_open');
  });

  it('closes on successful half-open request', () => {
    const fastCb = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 1 });
    fastCb.recordFailure();
    fastCb.recordFailure();

    const start = Date.now();
    while (Date.now() - start < 5) {
      // busy wait for cooldown
    }

    fastCb.shouldSkipPrimary(); // transitions to half-open
    expect(fastCb.getState()).toBe('half_open');

    fastCb.recordSuccess();
    expect(fastCb.getState()).toBe('closed');
    expect(fastCb.getFailureCount()).toBe(0);
  });

  it('re-opens on failed half-open request', () => {
    const fastCb = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 1 });
    fastCb.recordFailure();
    fastCb.recordFailure();

    const start = Date.now();
    while (Date.now() - start < 5) {
      // busy wait for cooldown
    }

    fastCb.shouldSkipPrimary(); // transitions to half-open
    fastCb.recordFailure();
    expect(fastCb.getState()).toBe('open');
  });

  it('resets consecutive failure counter on success', () => {
    cb.recordFailure();
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.getFailureCount()).toBe(3);

    cb.recordSuccess();
    expect(cb.getFailureCount()).toBe(0);
    expect(cb.getState()).toBe('closed');
  });

  it('reset() restores initial state', () => {
    for (let i = 0; i < 5; i++) {
      cb.recordFailure();
    }
    expect(cb.getState()).toBe('open');

    cb.reset();
    expect(cb.getState()).toBe('closed');
    expect(cb.getFailureCount()).toBe(0);
    expect(cb.shouldSkipPrimary()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Circuit breaker per-provider isolation
// ---------------------------------------------------------------------------

describe('Circuit breaker registry', () => {
  beforeEach(() => {
    resetAllCircuitBreakers();
  });

  it('returns separate breakers for different providers', () => {
    const claude = getCircuitBreaker('anthropic');
    const gemini = getCircuitBreaker('google-vertex');
    expect(claude).not.toBe(gemini);
  });

  it('returns the same breaker for the same provider', () => {
    const a = getCircuitBreaker('anthropic');
    const b = getCircuitBreaker('anthropic');
    expect(a).toBe(b);
  });

  it('Claude circuit state does not affect Gemini', () => {
    const claude = getCircuitBreaker('anthropic', { failureThreshold: 2 });
    const gemini = getCircuitBreaker('google-vertex', { failureThreshold: 2 });

    claude.recordFailure();
    claude.recordFailure();
    expect(claude.getState()).toBe('open');
    expect(gemini.getState()).toBe('closed');
  });
});

// ---------------------------------------------------------------------------
// callWithFallback tests
// ---------------------------------------------------------------------------

describe('callWithFallback', () => {
  beforeEach(() => {
    mockCallTradition.mockClear();
    mockLogger.log.mockClear();
    mockLogEntries.length = 0;
    resetAllCircuitBreakers();

    // Reset to default success behavior
    mockCallTradition.mockImplementation(() =>
      Promise.resolve({
        output: validAyurvedaOutput,
        metadata: { ...validMetadata },
      }),
    );
  });

  it('returns primary result on success with fallbackUsed=false', async () => {
    const result = await callWithFallback(
      'ayurveda',
      'system',
      'user',
      {} as never,
      defaultCallOptions,
    );

    expect(result.output).toEqual(validAyurvedaOutput);
    expect(result.fallbackUsed).toBe(false);
    expect(result.degradationEvent).toBeNull();
    expect(mockCallTradition).toHaveBeenCalledTimes(1);
  });

  it('falls back to Gemini when Claude fails for ayurveda', async () => {
    const fallbackOutput = { ...validAyurvedaOutput, rasa: 'bitter' };
    let callCount = 0;
    mockCallTradition.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        throw new MockTraditionCallError({
          tradition: 'ayurveda',
          cause: 'provider_error',
          message: 'Claude 500',
          model: 'claude-sonnet-4-6',
        });
      }
      return Promise.resolve({
        output: fallbackOutput,
        metadata: { ...validMetadata, model: 'gemini-2.5-flash' },
      });
    });

    const result = await callWithFallback(
      'ayurveda',
      'system',
      'user',
      {} as never,
      defaultCallOptions,
    );

    expect(result.output).toEqual(fallbackOutput);
    expect(result.fallbackUsed).toBe(true);
    expect(result.degradationEvent).not.toBeNull();
    expect(result.degradationEvent?.tradition).toBe('ayurveda');
    expect(result.degradationEvent?.fallbackModel).toBe('gemini-2.5-flash');
    expect(mockCallTradition).toHaveBeenCalledTimes(2);
  });

  it('falls back to Claude when Gemini fails for naturopathy', async () => {
    const fallbackOutput = { ...validAyurvedaOutput, rasa: 'sour' };
    let callCount = 0;
    mockCallTradition.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        throw new MockTraditionCallError({
          tradition: 'naturopathy',
          cause: 'provider_error',
          message: 'Gemini 500',
          model: 'gemini-2.5-flash',
        });
      }
      return Promise.resolve({
        output: fallbackOutput,
        metadata: { ...validMetadata, model: 'claude-sonnet-4-6' },
      });
    });

    const result = await callWithFallback(
      'naturopathy',
      'system',
      'user',
      {} as never,
      defaultCallOptions,
    );

    expect(result.output).toEqual(fallbackOutput);
    expect(result.fallbackUsed).toBe(true);
    expect(result.degradationEvent?.fallbackModel).toBe('claude-sonnet-4-6');
  });

  it('logs provider_degraded event on fallback', async () => {
    let callCount = 0;
    mockCallTradition.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        throw new Error('primary failed');
      }
      return Promise.resolve({
        output: validAyurvedaOutput,
        metadata: { ...validMetadata },
      });
    });

    await callWithFallback('ayurveda', 'system', 'user', {} as never, defaultCallOptions);

    const degradedLog = mockLogEntries.find((e) => e.message === 'provider_degraded');
    expect(degradedLog).toBeDefined();
    expect((degradedLog?.metadata as Record<string, unknown>)?.primaryModel).toBe(
      'claude-sonnet-4-6',
    );
    expect((degradedLog?.metadata as Record<string, unknown>)?.fallbackModel).toBe(
      'gemini-2.5-flash',
    );
  });

  it('uses the same prompt for primary and fallback', async () => {
    let callCount = 0;
    const capturedCalls: Array<{ system: string; user: string }> = [];
    mockCallTradition.mockImplementation(((...args: unknown[]) => {
      callCount++;
      capturedCalls.push({ system: args[1] as string, user: args[2] as string });
      if (callCount === 1) {
        throw new Error('primary failed');
      }
      return Promise.resolve({
        output: validAyurvedaOutput,
        metadata: { ...validMetadata },
      });
    }) as typeof mockCallTradition);

    await callWithFallback(
      'ayurveda',
      'the system prompt',
      'the user prompt',
      {} as never,
      defaultCallOptions,
    );

    expect(capturedCalls.length).toBe(2);
    expect(capturedCalls[0]?.system).toBe('the system prompt');
    expect(capturedCalls[0]?.user).toBe('the user prompt');
    expect(capturedCalls[1]?.system).toBe('the system prompt');
    expect(capturedCalls[1]?.user).toBe('the user prompt');
  });

  it('throws fallback_exhausted when both primary and fallback fail', async () => {
    mockCallTradition.mockImplementation(() => {
      throw new Error('provider down');
    });

    try {
      await callWithFallback('ayurveda', 'system', 'user', {} as never, defaultCallOptions);
      expect(true).toBe(false); // Should not reach
    } catch (error: unknown) {
      const err = error as MockTraditionCallError;
      expect(err.name).toBe('TraditionCallError');
      expect(err.cause).toBe('fallback_exhausted');
      expect(err.message).toContain('claude-sonnet-4-6');
      expect(err.message).toContain('gemini-2.5-flash');
    }
  });

  it('skips primary when circuit is open and goes directly to fallback', async () => {
    // Open the anthropic circuit
    const circuit = getCircuitBreaker('anthropic', { failureThreshold: 2 });
    circuit.recordFailure();
    circuit.recordFailure();
    expect(circuit.getState()).toBe('open');

    const capturedTraditions: string[] = [];
    mockCallTradition.mockImplementation(((...args: unknown[]) => {
      capturedTraditions.push(args[0] as string);
      return Promise.resolve({
        output: validAyurvedaOutput,
        metadata: { ...validMetadata },
      });
    }) as typeof mockCallTradition);

    const result = await callWithFallback(
      'ayurveda',
      'system',
      'user',
      {} as never,
      defaultCallOptions,
    );

    // Should only have called once (the fallback), not twice
    expect(mockCallTradition).toHaveBeenCalledTimes(1);
    // The fallback for ayurveda uses 'naturopathy' tradition key (maps to Gemini)
    expect(capturedTraditions[0]).toBe('naturopathy');
    expect(result.fallbackUsed).toBe(true);
  });

  it('does not affect other traditions when one falls back', async () => {
    let callCount = 0;
    mockCallTradition.mockImplementation(((...args: unknown[]) => {
      callCount++;
      const tradition = args[0] as string;
      if (tradition === 'ayurveda' && callCount === 1) {
        throw new Error('ayurveda primary failed');
      }
      return Promise.resolve({
        output: validAyurvedaOutput,
        metadata: { ...validMetadata },
      });
    }) as typeof mockCallTradition);

    // Ayurveda falls back
    const ayuResult = await callWithFallback(
      'ayurveda',
      'system',
      'user',
      {} as never,
      defaultCallOptions,
    );
    expect(ayuResult.fallbackUsed).toBe(true);

    // TCM should use primary without issues
    callCount = 0;
    mockCallTradition.mockClear();
    mockCallTradition.mockImplementation(() =>
      Promise.resolve({
        output: validAyurvedaOutput,
        metadata: { ...validMetadata },
      }),
    );

    const tcmResult = await callWithFallback(
      'tcm',
      'system',
      'user',
      {} as never,
      defaultCallOptions,
    );
    expect(tcmResult.fallbackUsed).toBe(false);
    // TCM uses the same anthropic circuit but only 1 failure recorded
    expect(mockCallTradition).toHaveBeenCalledTimes(1);
  });
});
