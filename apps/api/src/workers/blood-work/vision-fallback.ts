/**
 * Claude vision fallback for lab reports.
 *
 * Uses the native Anthropic Messages API with a `document` content block
 * (for PDFs) or `image` block (for JPEG/PNG). Output is constrained to a
 * Zod-validated JSON object; malformed responses are retried once.
 *
 * This module accepts an injectable `fetch` for testability.
 */

import { z } from 'zod';
import { type NormalizedBiomarker, NormalizedBiomarkerSchema } from './canonical-schema.js';
import type { VendorType } from './types.js';

export type VisionMediaType = 'application/pdf' | 'image/jpeg' | 'image/png';

export class VisionExtractionError extends Error {
  readonly code = 'VISION_EXTRACTION_FAILED';
  constructor(message = 'Vision extraction failed after retries') {
    super(message);
    this.name = 'VisionExtractionError';
  }
}

const MODEL = 'claude-sonnet-4-5-20250929';
const MAX_TOKENS = 4096;
const MAX_RETRIES = 2;

const VisionOutputSchema = z.object({
  vendor: z.enum(['lifelabs', 'quest', 'labcorp', 'ahs', 'unknown']),
  biomarkers: z.array(NormalizedBiomarkerSchema),
});

export type VisionOutput = z.infer<typeof VisionOutputSchema>;

const SYSTEM_PROMPT =
  'You are a lab report extraction system. Extract every biomarker test result from this document. ' +
  'Return a JSON object with two fields: "vendor" (one of lifelabs, quest, labcorp, ahs, unknown) and ' +
  '"biomarkers" (an array). For each biomarker include: canonicalKey (lowercase snake_case, e.g. ' +
  'vitamin_d_25_oh), displayName (test name as printed), value (numeric), unit (SI where possible), ' +
  'originalUnit (original unit as printed or null), referenceRangeLow (number or null), ' +
  'referenceRangeHigh (number or null), flag (normal|low|high|critical), loincCode (string or null), ' +
  'confidence (0-1). Respond with JSON only — no prose, no markdown fences.';

const USER_TEXT =
  'Extract all biomarker test results from this lab report. Return structured JSON matching the schema.';

export interface VisionFallbackOptions {
  apiKey: string;
  /** Injected for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
  /** Override the model in tests. */
  model?: string;
}

function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function buildContentBlock(mediaType: VisionMediaType, data: string): Record<string, unknown> {
  if (mediaType === 'application/pdf') {
    return {
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data },
    };
  }
  return {
    type: 'image',
    source: { type: 'base64', media_type: mediaType, data },
  };
}

function stripJsonFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}

/**
 * Run the Claude vision pipeline. Throws VisionExtractionError after all
 * retries. Caller is responsible for catching and mapping to user-facing
 * copy.
 */
export async function extractViaVision(
  fileBuffer: ArrayBuffer | Uint8Array,
  mediaType: VisionMediaType,
  options: VisionFallbackOptions,
): Promise<{ biomarkers: NormalizedBiomarker[]; vendor: VendorType }> {
  // Reject unsupported types early.
  if (mediaType !== 'application/pdf' && mediaType !== 'image/jpeg' && mediaType !== 'image/png') {
    throw new VisionExtractionError(`Unsupported media type: ${mediaType as string}`);
  }

  const { apiKey, fetchImpl = fetch, model = MODEL } = options;
  if (!apiKey) {
    throw new VisionExtractionError('ANTHROPIC_API_KEY is required for vision fallback');
  }

  const base64 = arrayBufferToBase64(fileBuffer);
  const contentBlock = buildContentBlock(mediaType, base64);

  const body = {
    model,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [contentBlock, { type: 'text', text: USER_TEXT }],
      },
    ],
  };

  let lastError: unknown = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    try {
      const res = await fetchImpl('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'pdfs-2024-09-25',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        // Retry on 429 / 5xx.
        if (res.status === 429 || res.status >= 500) {
          lastError = new Error(`Anthropic API ${res.status}`);
          continue;
        }
        throw new VisionExtractionError(`Anthropic API error ${res.status}`);
      }

      const json = (await res.json()) as {
        content?: Array<{ type: string; text?: string }>;
      };
      const textBlock = (json.content ?? []).find((b) => b.type === 'text');
      const rawText = textBlock?.text ?? '';
      if (!rawText) {
        lastError = new Error('empty_response');
        continue;
      }

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(stripJsonFences(rawText));
      } catch {
        lastError = new Error('invalid_json');
        continue;
      }

      const result = VisionOutputSchema.safeParse(parsedJson);
      if (!result.success) {
        lastError = result.error;
        continue;
      }

      return {
        vendor: result.data.vendor,
        biomarkers: result.data.biomarkers,
      };
    } catch (err) {
      lastError = err;
    }
  }

  throw new VisionExtractionError(
    lastError instanceof Error ? `Vision failed: ${lastError.message}` : 'Vision failed',
  );
}

export { VisionOutputSchema };
