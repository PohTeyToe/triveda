import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import {
  type LLMCallLogEntry,
  aggregateCosts,
  buildLogEntry,
  computeCost,
  computePromptHash,
  createStderrLogger,
  logLLMCall,
  setTelemetryLogger,
} from '../../src/llm/telemetry.js';

// TelemetryLogger interface -- inline to avoid deep shared import resolution
interface TelemetryLogger {
  log(
    level: 'info' | 'warn' | 'error',
    message: string,
    metadata?: Record<string, unknown>,
  ): Promise<void>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntry(overrides: Partial<LLMCallLogEntry> = {}): LLMCallLogEntry {
  return {
    requestId: 'req-001',
    userId: 'user-001',
    foodId: 'food-oats',
    tradition: 'ayurveda',
    model: 'claude-sonnet-4-6',
    promptHash: 'abc123',
    promptVersion: 'v1',
    tokensIn: 1200,
    tokensOut: 300,
    costUsd: 0.008,
    latencyFirstByteMs: 150,
    latencyTotalMs: 800,
    cacheHit: false,
    responseJson: { rasa: 'sweet' },
    error: null,
    fallbackUsed: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests: logLLMCall
// ---------------------------------------------------------------------------

describe('logLLMCall', () => {
  let mockLogger: TelemetryLogger;
  let logCalls: { level: string; message: string; metadata: Record<string, unknown> | undefined }[];

  beforeEach(() => {
    logCalls = [];
    mockLogger = {
      async log(level, message, metadata) {
        logCalls.push({ level, message, metadata });
      },
    };
    setTelemetryLogger(mockLogger);
  });

  it('logs a call with all required fields', async () => {
    const entry = makeEntry();
    logLLMCall(entry);
    // Wait for the async fire-and-forget to complete
    await new Promise((r) => setTimeout(r, 10));

    expect(logCalls.length).toBe(1);
    const logged = logCalls[0];
    expect(logged.level).toBe('info');
    expect(logged.message).toBe('llm_call');
  });

  it('includes request_id, user_id, food_id, tradition', async () => {
    logLLMCall(makeEntry());
    await new Promise((r) => setTimeout(r, 10));

    const meta = logCalls[0].metadata ?? {};
    expect(meta.requestId).toBe('req-001');
    expect(meta.userId).toBe('user-001');
    expect(meta.foodId).toBe('food-oats');
    expect(meta.tradition).toBe('ayurveda');
  });

  it('includes model, tokensIn, tokensOut, costUsd', async () => {
    logLLMCall(makeEntry());
    await new Promise((r) => setTimeout(r, 10));

    const meta = logCalls[0].metadata ?? {};
    expect(meta.model).toBe('claude-sonnet-4-6');
    expect(meta.tokensIn).toBe(1200);
    expect(meta.tokensOut).toBe(300);
    expect(meta.costUsd).toBe(0.008);
  });

  it('includes promptHash, promptVersion, latency values', async () => {
    logLLMCall(makeEntry());
    await new Promise((r) => setTimeout(r, 10));

    const meta = logCalls[0].metadata ?? {};
    expect(meta.promptHash).toBe('abc123');
    expect(meta.promptVersion).toBe('v1');
    expect(meta.latencyFirstByteMs).toBe(150);
    expect(meta.latencyTotalMs).toBe(800);
  });

  it('includes cacheHit boolean', async () => {
    logLLMCall(makeEntry({ cacheHit: true }));
    await new Promise((r) => setTimeout(r, 10));

    expect(logCalls[0].metadata?.cacheHit).toBe(true);
  });

  it('includes responseJson', async () => {
    const json = { rasa: 'sweet', virya: 'cooling' };
    logLLMCall(makeEntry({ responseJson: json }));
    await new Promise((r) => setTimeout(r, 10));

    expect(logCalls[0].metadata?.responseJson).toEqual(json);
  });

  it('does not throw on logger failure (fire-and-forget)', async () => {
    const stderrSpy = spyOn(process.stderr, 'write').mockImplementation(() => true);
    const failingLogger: TelemetryLogger = {
      async log() {
        throw new Error('DB connection lost');
      },
    };
    setTelemetryLogger(failingLogger);

    // Should not throw
    logLLMCall(makeEntry());
    await new Promise((r) => setTimeout(r, 10));

    // Should have logged the failure to stderr
    expect(stderrSpy).toHaveBeenCalled();
    const written = stderrSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(written);
    expect(parsed.event).toBe('llm_call_log_failed');
    expect(parsed.error).toBe('DB connection lost');
    expect(parsed.tradition).toBe('ayurveda');
    expect(parsed.requestId).toBe('req-001');

    stderrSpy.mockRestore();
  });

  it('logs failure to stderr as structured JSON on error', async () => {
    const stderrSpy = spyOn(process.stderr, 'write').mockImplementation(() => true);
    const failingLogger: TelemetryLogger = {
      async log() {
        throw new Error('Insert timeout');
      },
    };
    setTelemetryLogger(failingLogger);

    logLLMCall(makeEntry({ tradition: 'tcm', requestId: 'req-999' }));
    await new Promise((r) => setTimeout(r, 10));

    const written = stderrSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(written);
    expect(parsed.event).toBe('llm_call_log_failed');
    expect(parsed.tradition).toBe('tcm');
    expect(parsed.requestId).toBe('req-999');

    stderrSpy.mockRestore();
  });

  it('does not block the caller (async fire-and-forget)', () => {
    // logLLMCall is synchronous and returns void immediately
    const start = performance.now();
    logLLMCall(makeEntry());
    const elapsed = performance.now() - start;

    // Should return in under 5ms (no awaiting)
    expect(elapsed).toBeLessThan(5);
  });
});

// ---------------------------------------------------------------------------
// Tests: computeCost
// ---------------------------------------------------------------------------

describe('computeCost', () => {
  it('returns correct USD for known Claude token counts', () => {
    // 1000 input tokens at $3/1M = $0.003, 500 output at $15/1M = $0.0075
    const cost = computeCost('claude-sonnet-4-6', 1000, 500);
    expect(cost).toBeCloseTo(0.0105, 6);
  });

  it('returns correct USD for known Gemini token counts', () => {
    // 1000 input at $0.15/1M = $0.00015, 500 output at $0.60/1M = $0.0003
    const cost = computeCost('gemini-2.5-flash', 1000, 500);
    expect(cost).toBeCloseTo(0.00045, 6);
  });

  it('applies 0.1x multiplier for cache hit', () => {
    // 1000 input at $3/1M * 0.1 = $0.0003, 500 output at $15/1M = $0.0075
    const cost = computeCost('claude-sonnet-4-6', 1000, 500, 'hit');
    expect(cost).toBeCloseTo(0.0078, 6);
  });

  it('applies 1.25x multiplier for cache write', () => {
    // 1000 input at $3/1M * 1.25 = $0.00375, 500 output at $15/1M = $0.0075
    const cost = computeCost('claude-sonnet-4-6', 1000, 500, 'write');
    expect(cost).toBeCloseTo(0.01125, 6);
  });

  it('returns 0 for zero tokens', () => {
    expect(computeCost('claude-sonnet-4-6', 0, 0)).toBe(0);
  });

  it('returns 0 for unknown model', () => {
    expect(computeCost('unknown-model', 1000, 500)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Tests: computePromptHash
// ---------------------------------------------------------------------------

describe('computePromptHash', () => {
  it('returns a 64-character hex string', () => {
    const hash = computePromptHash('system prompt', 'user prompt');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('returns different hashes for different prompts', () => {
    const hash1 = computePromptHash('system a', 'user a');
    const hash2 = computePromptHash('system b', 'user b');
    expect(hash1).not.toBe(hash2);
  });

  it('returns same hash for identical prompts', () => {
    const hash1 = computePromptHash('system', 'user');
    const hash2 = computePromptHash('system', 'user');
    expect(hash1).toBe(hash2);
  });
});

// ---------------------------------------------------------------------------
// Tests: aggregateCosts
// ---------------------------------------------------------------------------

describe('aggregateCosts', () => {
  it('sums costs across traditions', () => {
    const entries = [
      { tradition: 'ayurveda' as const, costUsd: 0.003 },
      { tradition: 'tcm' as const, costUsd: 0.003 },
      { tradition: 'naturopathy' as const, costUsd: 0.001 },
      { tradition: 'synthesis' as const, costUsd: 0.003 },
    ];
    const result = aggregateCosts(entries);
    expect(result.totalCostUsd).toBeCloseTo(0.01, 6);
    expect(result.perTradition.ayurveda).toBe(0.003);
    expect(result.perTradition.naturopathy).toBe(0.001);
  });
});

// ---------------------------------------------------------------------------
// Tests: buildLogEntry
// ---------------------------------------------------------------------------

describe('buildLogEntry', () => {
  it('builds a complete log entry from context and metadata', () => {
    const context = {
      requestId: 'req-001',
      userId: 'user-001',
      foodId: 'food-oats',
      tradition: 'ayurveda' as const,
      promptHash: 'hash123',
      promptVersion: 'v1',
      fallbackUsed: false,
    };
    const metadata = {
      tokensIn: 1200,
      tokensOut: 300,
      costUsd: 0.008,
      latencyFirstByteMs: 150,
      latencyTotalMs: 800,
      cacheHit: false,
      model: 'claude-sonnet-4-6',
    };
    const entry = buildLogEntry(context, metadata, { rasa: 'sweet' }, null);

    expect(entry.requestId).toBe('req-001');
    expect(entry.tradition).toBe('ayurveda');
    expect(entry.model).toBe('claude-sonnet-4-6');
    expect(entry.tokensIn).toBe(1200);
    expect(entry.responseJson).toEqual({ rasa: 'sweet' });
    expect(entry.error).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tests: createStderrLogger
// ---------------------------------------------------------------------------

describe('createStderrLogger', () => {
  it('writes structured JSON to stderr', async () => {
    const stderrSpy = spyOn(process.stderr, 'write').mockImplementation(() => true);
    const logger = createStderrLogger();

    await logger.log('info', 'test message', { key: 'value' });

    expect(stderrSpy).toHaveBeenCalledTimes(1);
    const written = stderrSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(written.trim());
    expect(parsed.level).toBe('info');
    expect(parsed.message).toBe('test message');
    expect(parsed.key).toBe('value');

    stderrSpy.mockRestore();
  });
});
