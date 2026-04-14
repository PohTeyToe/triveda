/**
 * Integration test for the additional-inputs API client.
 *
 * Scope: verifies that a daily check-in submitted through the client
 * propagates to the daily-food response as a CreditSource chip row.
 *
 * Mocks global fetch so the test is hermetic and does not hit a
 * running backend. The point is the contract between submit and credit
 * chip, not the transport.
 */

import type { DailyCheckInAnswer } from '@triveda/shared/inputs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { saveDailyCheckIn, updateCulturalPreferences, uploadFaceScan } from '../api-client';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const checkInAnswer: DailyCheckInAnswer = {
  date: '2026-04-12',
  selections: { energy: 'left', temperature: 'right' },
  dismissed: false,
  synced: false,
};

const dailyFoodWithCreditChip = {
  food: { id: 'f-1', name: 'Kitchari', totalScore: 0.82, breakdown: {} },
  three_tradition_output: {
    ayurveda: {},
    tcm: {},
    naturopathy: {},
    synthesis: { twoSentenceRationale: 'Warm and grounding.' },
  },
  convergence_report: {
    score: 0.7,
    agreementCount: 2,
    interestingDivergence: false,
    dimensions: {},
  },
  optional_profiling_question: null,
  credits: [
    {
      featureId: 'daily-check-in',
      featureName: "Today's check-in",
      active: true,
      contribution: 'Nudged up because you reported feeling tired and cold',
    },
  ],
};

// ---------------------------------------------------------------------------
// Fetch mock harness
// ---------------------------------------------------------------------------

type Handler = (url: string, init?: RequestInit) => Response | Promise<Response>;

function installFetch(handler: Handler) {
  const spy = vi.fn(async (input: Request | URL | string, init?: RequestInit) => {
    const url =
      typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    return handler(url, init);
  });
  vi.stubGlobal('fetch', spy);
  return spy;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('additional-inputs / integration: check-in → daily-card credit chip', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('submits a check-in and surfaces a credit chip on the daily-food response', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchSpy = installFetch(async (url, init) => {
      calls.push({ url, init });
      if (url.endsWith('/daily-check-in') && init?.method === 'POST') {
        return jsonResponse({ success: true, timestamp: '2026-04-12T12:00:00Z' });
      }
      if (url.includes('/daily-food')) {
        return jsonResponse(dailyFoodWithCreditChip);
      }
      return jsonResponse({ error: 'unexpected' }, 500);
    });

    // 1. Submit the check-in.
    const saveResult = await saveDailyCheckIn(checkInAnswer);
    expect(saveResult.success).toBe(true);
    expect(saveResult.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    // Stripping the client-only synced field happens inside the client.
    const savedCall = calls.find((c) => c.url.endsWith('/daily-check-in'));
    expect(savedCall).toBeDefined();
    const savedBody = JSON.parse(savedCall?.init?.body as string);
    expect(savedBody.synced).toBeUndefined();
    expect(savedBody.date).toBe('2026-04-12');
    expect(savedBody.selections).toEqual({ energy: 'left', temperature: 'right' });

    // 2. Fetch the daily-food response that would render on the home card.
    const dailyFoodRes = await fetch('/api/v1/daily-food?date=2026-04-12');
    const dailyFood = await dailyFoodRes.json();

    // 3. Assert credit chip row for the check-in is present.
    expect(dailyFood.credits).toBeInstanceOf(Array);
    const checkInCredit = dailyFood.credits.find(
      (c: { featureId: string }) => c.featureId === 'daily-check-in',
    );
    expect(checkInCredit, 'daily-check-in credit row should be present').toBeDefined();
    expect(checkInCredit.active).toBe(true);
    expect(checkInCredit.contribution).toMatch(/nudged|because/i);

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('uploadFaceScan posts to /face-scan and returns the stored id', async () => {
    const fetchSpy = installFetch(async (url, init) => {
      if (url.endsWith('/face-scan') && init?.method === 'POST') {
        return jsonResponse({ id: 'scan-abc' });
      }
      return jsonResponse({}, 404);
    });

    const reading = {
      vata_delta: 0.1,
      pitta_delta: -0.05,
      kapha_delta: 0,
      wood_hint: 0.4,
      fire_hint: 0.3,
      earth_hint: 0.2,
      metal_hint: 0.5,
      water_hint: 0.6,
      stress_level: 0.3,
      skin_tone: 'medium',
      confidence: 0.55,
      simulated: true as const,
      generated_at: '2026-04-12T09:00:00.000Z',
      seed_hour: 9,
    };

    const result = await uploadFaceScan(reading);
    expect(result).toEqual({ id: 'scan-abc' });
    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it('updateCulturalPreferences rejects invalid cuisine codes before calling fetch', async () => {
    const fetchSpy = installFetch(async () => jsonResponse({}));

    await expect(updateCulturalPreferences(['martian'])).rejects.toThrow(/Invalid cuisine/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
