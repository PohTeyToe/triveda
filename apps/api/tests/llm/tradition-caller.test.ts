import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { z } from 'zod';

/**
 * Tradition caller tests.
 *
 * Uses Bun's mock system to stub generateText from the `ai` package,
 * getModelForTradition from the provider factory, and the shared types.
 */

// ---------------------------------------------------------------------------
// Test schema and fixtures
// ---------------------------------------------------------------------------

const testSchema = z.object({
  rasa: z.string(),
  virya: z.string(),
  plain_english: z.string(),
});

type TestOutput = z.infer<typeof testSchema>;

const validOutput: TestOutput = {
  rasa: 'sweet',
  virya: 'cooling',
  plain_english: 'This food is cooling.',
};

// ---------------------------------------------------------------------------
// Mock setup -- must happen before importing the module under test
// ---------------------------------------------------------------------------

// Mock the NoObjectGeneratedError class
class MockNoObjectGeneratedError extends Error {
  readonly text: string | undefined;
  readonly usage: unknown;
  readonly response: unknown;
  readonly finishReason: string | undefined;

  constructor(opts: {
    text?: string;
    usage?: unknown;
    response?: unknown;
    finishReason?: string;
  }) {
    super('No object generated');
    this.name = 'NoObjectGeneratedError';
    this.text = opts.text;
    this.usage = opts.usage;
    this.response = opts.response;
    this.finishReason = opts.finishReason;
  }

  static isInstance(error: unknown): boolean {
    return error instanceof MockNoObjectGeneratedError;
  }
}

// Mock generateText function
const mockGenerateText = mock(() =>
  Promise.resolve({
    output: validOutput,
    usage: {
      inputTokens: 500,
      outputTokens: 100,
      inputTokenDetails: {
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        noCacheTokens: 500,
      },
      outputTokenDetails: { reasoningTokens: 0 },
    },
    text: JSON.stringify(validOutput),
    finishReason: 'stop' as const,
  }),
);

// Mock model object
const mockModel = {
  modelId: 'claude-sonnet-4-6',
  specificationVersion: 'v1',
  provider: 'anthropic',
  defaultObjectGenerationMode: 'json',
  doGenerate: mock(() => Promise.resolve({})),
};

const mockGetModelForTradition = mock(() => mockModel);

// Mock TraditionCallError (from shared types)
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

// Register module mocks
mock.module('ai', () => ({
  generateText: mockGenerateText,
  Output: {
    object: ({ schema }: { schema: unknown }) => ({ name: 'object', schema }),
  },
  NoObjectGeneratedError: MockNoObjectGeneratedError,
}));

mock.module('@triveda/shared/llm/types.js', () => ({
  TraditionCallError: MockTraditionCallError,
  DEFAULT_PROVIDER_MAP: {
    ayurveda: {
      model: 'claude-sonnet-4-6',
      temperature: 0.3,
      maxTokens: 1024,
      provider: 'anthropic',
    },
    tcm: {
      model: 'claude-sonnet-4-6',
      temperature: 0.3,
      maxTokens: 1024,
      provider: 'anthropic',
    },
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

mock.module('../../src/llm/provider-factory.js', () => ({
  getModelForTradition: mockGetModelForTradition,
}));

// Import after mocking
const { callTradition } = await import('../../src/llm/tradition-caller.js');

// ---------------------------------------------------------------------------
// Options fixture
// ---------------------------------------------------------------------------

interface CallOptions {
  requestId: string;
  userId: string;
  foodId: string;
  promptVersion: string;
  signal?: AbortSignal;
}

const defaultOptions: CallOptions = {
  requestId: 'req-001',
  userId: 'user-001',
  foodId: 'food-001',
  promptVersion: 'v1',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('callTradition', () => {
  beforeEach(() => {
    mockGenerateText.mockClear();
    mockGetModelForTradition.mockClear();
    // Reset to default success behavior
    mockGenerateText.mockImplementation(() =>
      Promise.resolve({
        output: validOutput,
        usage: {
          inputTokens: 500,
          outputTokens: 100,
          inputTokenDetails: {
            cacheReadTokens: 0,
            cacheWriteTokens: 0,
            noCacheTokens: 500,
          },
          outputTokenDetails: { reasoningTokens: 0 },
        },
        text: JSON.stringify(validOutput),
        finishReason: 'stop' as const,
      }),
    );
  });

  it('returns typed output on successful call', async () => {
    const result = await callTradition(
      'ayurveda',
      'system prompt',
      'user prompt',
      testSchema,
      defaultOptions,
    );

    expect(result.output).toEqual(validOutput);
    expect(result.output.rasa).toBe('sweet');
    expect(result.output.virya).toBe('cooling');
  });

  it('passes model, system, prompt, and maxRetries to generateText', async () => {
    await callTradition(
      'ayurveda',
      'my system prompt',
      'my user prompt',
      testSchema,
      defaultOptions,
    );

    expect(mockGenerateText).toHaveBeenCalledTimes(1);
    const callArgs = (mockGenerateText.mock.calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(callArgs.system).toBe('my system prompt');
    expect(callArgs.prompt).toBe('my user prompt');
    expect(callArgs.maxRetries).toBe(3);
  });

  it('records latency_total_ms in metadata', async () => {
    const result = await callTradition(
      'ayurveda',
      'system prompt',
      'user prompt',
      testSchema,
      defaultOptions,
    );

    expect(result.metadata.latencyTotalMs).toBeGreaterThanOrEqual(0);
    expect(typeof result.metadata.latencyTotalMs).toBe('number');
  });

  it('computes cost from usage metadata', async () => {
    mockGenerateText.mockImplementation(() =>
      Promise.resolve({
        output: validOutput,
        usage: {
          inputTokens: 1000,
          outputTokens: 200,
          inputTokenDetails: {
            cacheReadTokens: 0,
            cacheWriteTokens: 0,
            noCacheTokens: 1000,
          },
          outputTokenDetails: { reasoningTokens: 0 },
        },
        text: JSON.stringify(validOutput),
        finishReason: 'stop' as const,
      }),
    );

    const result = await callTradition(
      'ayurveda',
      'system prompt',
      'user prompt',
      testSchema,
      defaultOptions,
    );

    // claude-sonnet-4-6: input $3/1M, output $15/1M
    // 1000 input tokens = $0.003, 200 output tokens = $0.003
    expect(result.metadata.costUsd).toBeGreaterThan(0);
    expect(result.metadata.tokensIn).toBe(1000);
    expect(result.metadata.tokensOut).toBe(200);
  });

  it('detects cache hit from inputTokenDetails', async () => {
    mockGenerateText.mockImplementation(() =>
      Promise.resolve({
        output: validOutput,
        usage: {
          inputTokens: 1000,
          outputTokens: 200,
          inputTokenDetails: {
            cacheReadTokens: 800,
            cacheWriteTokens: 0,
            noCacheTokens: 200,
          },
          outputTokenDetails: { reasoningTokens: 0 },
        },
        text: JSON.stringify(validOutput),
        finishReason: 'stop' as const,
      }),
    );

    const result = await callTradition(
      'ayurveda',
      'system prompt',
      'user prompt',
      testSchema,
      defaultOptions,
    );

    expect(result.metadata.cacheHit).toBe(true);
  });

  it('reports cacheHit false when no cached tokens', async () => {
    const result = await callTradition(
      'ayurveda',
      'system prompt',
      'user prompt',
      testSchema,
      defaultOptions,
    );

    expect(result.metadata.cacheHit).toBe(false);
  });

  it('retries once on NoObjectGeneratedError with stricter prompt', async () => {
    let callCount = 0;
    mockGenerateText.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        throw new MockNoObjectGeneratedError({
          text: '{"invalid": true}',
          usage: { inputTokens: 500, outputTokens: 50 },
          response: {},
          finishReason: 'stop',
        });
      }
      return Promise.resolve({
        output: validOutput,
        usage: {
          inputTokens: 600,
          outputTokens: 120,
          inputTokenDetails: {
            cacheReadTokens: 0,
            cacheWriteTokens: 0,
            noCacheTokens: 600,
          },
          outputTokenDetails: { reasoningTokens: 0 },
        },
        text: JSON.stringify(validOutput),
        finishReason: 'stop' as const,
      });
    });

    const result = await callTradition(
      'ayurveda',
      'system prompt',
      'user prompt',
      testSchema,
      defaultOptions,
    );

    expect(callCount).toBe(2);
    expect(result.output).toEqual(validOutput);
    // Second call should have STRICT REMINDER appended
    const secondCallArgs = (mockGenerateText.mock.calls[1] as unknown[])[0] as Record<
      string,
      unknown
    >;
    expect(secondCallArgs.prompt as string).toContain('STRICT REMINDER');
  });

  it('throws TraditionCallError after second NoObjectGeneratedError', async () => {
    mockGenerateText.mockImplementation(() => {
      throw new MockNoObjectGeneratedError({
        text: '{"bad": "output"}',
        usage: { inputTokens: 500, outputTokens: 50 },
        response: {},
        finishReason: 'stop',
      });
    });

    try {
      await callTradition('ayurveda', 'system prompt', 'user prompt', testSchema, defaultOptions);
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: unknown) {
      const err = error as MockTraditionCallError;
      expect(err.name).toBe('TraditionCallError');
      expect(err.tradition).toBe('ayurveda');
      expect(err.cause).toBe('validation_failed');
      expect(err.model).toBe('claude-sonnet-4-6');
    }
  });

  it('TraditionCallError includes rawResponse on validation failure', async () => {
    mockGenerateText.mockImplementation(() => {
      throw new MockNoObjectGeneratedError({
        text: 'not valid json at all',
        usage: { inputTokens: 500, outputTokens: 50 },
        response: {},
        finishReason: 'stop',
      });
    });

    try {
      await callTradition('ayurveda', 'system prompt', 'user prompt', testSchema, defaultOptions);
      expect(true).toBe(false);
    } catch (error: unknown) {
      const err = error as MockTraditionCallError;
      expect(err.rawResponse).toBe('not valid json at all');
    }
  });

  it('throws TraditionCallError with provider_error on unexpected errors', async () => {
    mockGenerateText.mockImplementation(() => {
      throw new Error('Network timeout');
    });

    try {
      await callTradition('ayurveda', 'system prompt', 'user prompt', testSchema, defaultOptions);
      expect(true).toBe(false);
    } catch (error: unknown) {
      const err = error as MockTraditionCallError;
      expect(err.name).toBe('TraditionCallError');
      expect(err.cause).toBe('provider_error');
      expect(err.message).toContain('Network timeout');
    }
  });

  it('records model name in metadata', async () => {
    const result = await callTradition(
      'ayurveda',
      'system prompt',
      'user prompt',
      testSchema,
      defaultOptions,
    );

    expect(result.metadata.model).toBe('claude-sonnet-4-6');
  });

  it('records model as gemini-2.5-flash for naturopathy', async () => {
    const result = await callTradition(
      'naturopathy',
      'system prompt',
      'user prompt',
      testSchema,
      defaultOptions,
    );

    expect(result.metadata.model).toBe('gemini-2.5-flash');
  });

  it('sets latencyFirstByteMs equal to latencyTotalMs for non-streaming', async () => {
    const result = await callTradition(
      'ayurveda',
      'system prompt',
      'user prompt',
      testSchema,
      defaultOptions,
    );

    expect(result.metadata.latencyFirstByteMs).toBe(result.metadata.latencyTotalMs);
  });

  it('passes maxRetries: 3 to generateText options', async () => {
    await callTradition('tcm', 'system prompt', 'user prompt', testSchema, defaultOptions);

    const callArgs = (mockGenerateText.mock.calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(callArgs.maxRetries).toBe(3);
  });

  it('passes abortSignal through to generateText', async () => {
    const controller = new AbortController();
    const optionsWithSignal = { ...defaultOptions, signal: controller.signal };

    await callTradition('ayurveda', 'system prompt', 'user prompt', testSchema, optionsWithSignal);

    const callArgs = (mockGenerateText.mock.calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(callArgs.abortSignal).toBe(controller.signal);
  });
});
