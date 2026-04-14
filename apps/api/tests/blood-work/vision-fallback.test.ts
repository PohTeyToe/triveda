/**
 * Vision fallback tests. Uses a mocked fetch to avoid hitting the real
 * Anthropic API.
 */

import { describe, expect, it } from 'bun:test';
import {
  VisionExtractionError,
  extractViaVision,
} from '../../src/workers/blood-work/vision-fallback.js';

function successResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function errorResponse(status: number): Response {
  return new Response('{"error":"fail"}', {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

interface ContentBlock {
  type: string;
  source?: { media_type?: string };
}
interface BodyShape {
  messages?: Array<{ content?: ContentBlock[] }>;
}

function mockClaudeResponseText(json: unknown): Response {
  return successResponse({
    content: [{ type: 'text', text: JSON.stringify(json) }],
  });
}

const VALID_OUTPUT = {
  vendor: 'lifelabs',
  biomarkers: [
    {
      canonicalKey: 'ferritin',
      displayName: 'Ferritin',
      value: 50,
      unit: 'ug/L',
      originalUnit: null,
      referenceRangeLow: 20,
      referenceRangeHigh: 200,
      flag: 'normal',
      loincCode: '2276-4',
      confidence: 0.9,
    },
  ],
};

describe('extractViaVision', () => {
  it('sends PDF as document content block', async () => {
    let capturedBody: unknown = null;
    const fetchImpl: typeof fetch = async (_input, init) => {
      capturedBody = JSON.parse(String(init?.body ?? '{}'));
      return mockClaudeResponseText(VALID_OUTPUT);
    };

    await extractViaVision(new Uint8Array([1, 2, 3]), 'application/pdf', {
      apiKey: 'test-key',
      fetchImpl,
    });

    const body = capturedBody as { messages?: Array<{ content?: Array<{ type: string }> }> };
    expect(body?.messages?.[0]?.content?.[0]?.type).toBe('document');
  });

  it('sends JPEG image as image content block', async () => {
    let body: BodyShape | null = null;
    const fetchImpl: typeof fetch = async (_input, init) => {
      body = JSON.parse(String(init?.body ?? '{}')) as BodyShape;
      return mockClaudeResponseText(VALID_OUTPUT);
    };

    await extractViaVision(new Uint8Array([1, 2, 3]), 'image/jpeg', {
      apiKey: 'test-key',
      fetchImpl,
    });

    expect(body?.messages?.[0]?.content?.[0]?.type).toBe('image');
    expect(body?.messages?.[0]?.content?.[0]?.source?.media_type).toBe('image/jpeg');
  });

  it('sends PNG image as image content block', async () => {
    let body: BodyShape | null = null;
    const fetchImpl: typeof fetch = async (_input, init) => {
      body = JSON.parse(String(init?.body ?? '{}')) as BodyShape;
      return mockClaudeResponseText(VALID_OUTPUT);
    };

    await extractViaVision(new Uint8Array([1, 2, 3]), 'image/png', {
      apiKey: 'test-key',
      fetchImpl,
    });

    expect(body?.messages?.[0]?.content?.[0]?.source?.media_type).toBe('image/png');
  });

  it('returns Zod-validated biomarkers from mock response', async () => {
    const fetchImpl: typeof fetch = async () => mockClaudeResponseText(VALID_OUTPUT);
    const result = await extractViaVision(new Uint8Array([1, 2, 3]), 'application/pdf', {
      apiKey: 'test-key',
      fetchImpl,
    });
    expect(result.vendor).toBe('lifelabs');
    expect(result.biomarkers.length).toBe(1);
    expect(result.biomarkers[0]?.canonicalKey).toBe('ferritin');
  });

  it('retries on 429 and succeeds on second attempt', async () => {
    let attempt = 0;
    const fetchImpl: typeof fetch = async () => {
      attempt += 1;
      if (attempt === 1) return errorResponse(429);
      return mockClaudeResponseText(VALID_OUTPUT);
    };
    const result = await extractViaVision(new Uint8Array([1, 2, 3]), 'application/pdf', {
      apiKey: 'test-key',
      fetchImpl,
    });
    expect(result.biomarkers.length).toBe(1);
    expect(attempt).toBe(2);
  });

  it('throws VisionExtractionError after retries exhaust', async () => {
    const fetchImpl: typeof fetch = async () => errorResponse(500);
    await expect(
      extractViaVision(new Uint8Array([1, 2, 3]), 'application/pdf', {
        apiKey: 'test-key',
        fetchImpl,
      }),
    ).rejects.toBeInstanceOf(VisionExtractionError);
  });

  it('retries on malformed JSON response', async () => {
    let attempt = 0;
    const fetchImpl: typeof fetch = async () => {
      attempt += 1;
      if (attempt === 1) {
        return successResponse({ content: [{ type: 'text', text: 'not json' }] });
      }
      return mockClaudeResponseText(VALID_OUTPUT);
    };
    const result = await extractViaVision(new Uint8Array([1, 2, 3]), 'application/pdf', {
      apiKey: 'test-key',
      fetchImpl,
    });
    expect(result.biomarkers.length).toBe(1);
    expect(attempt).toBe(2);
  });

  it('strips JSON fences from Claude response before parsing', async () => {
    const fenced = `\`\`\`json\n${JSON.stringify(VALID_OUTPUT)}\n\`\`\``;
    const fetchImpl: typeof fetch = async () =>
      successResponse({ content: [{ type: 'text', text: fenced }] });
    const result = await extractViaVision(new Uint8Array([1, 2, 3]), 'application/pdf', {
      apiKey: 'test-key',
      fetchImpl,
    });
    expect(result.biomarkers.length).toBe(1);
  });

  it('throws when apiKey is missing', async () => {
    await expect(
      extractViaVision(new Uint8Array([1, 2, 3]), 'application/pdf', { apiKey: '' }),
    ).rejects.toBeInstanceOf(VisionExtractionError);
  });

  it('throws for unsupported media type', async () => {
    await expect(
      extractViaVision(
        new Uint8Array([1, 2, 3]),
        // @ts-expect-error -- intentional bad media type
        'image/heic',
        { apiKey: 'test-key' },
      ),
    ).rejects.toBeInstanceOf(VisionExtractionError);
  });
});
