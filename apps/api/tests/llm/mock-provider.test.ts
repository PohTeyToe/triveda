import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test';
import {
  ayurvedaOutputSchema,
  naturopathyOutputSchema,
  synthesisOutputSchema,
  tcmOutputSchema,
} from '@triveda/shared/src/llm/index.js';
import type {
  AyurvedaOutput,
  NaturopathyOutput,
  SynthesisOutput,
  TCMOutput,
} from '@triveda/shared/src/llm/types.js';
import { getMockOutputs, getMockResponse, isMockMode } from '../../src/llm/mock-provider.js';

// ---------------------------------------------------------------------------
// Helpers -- transform camelCase output to snake_case for Zod validation
// ---------------------------------------------------------------------------

function ayurvedaToSnake(o: AyurvedaOutput) {
  return {
    rasa: o.rasa,
    virya: o.virya,
    vipaka: o.vipaka,
    dosha_rationale: o.doshaRationale,
    plain_english: o.plainEnglish,
  };
}

function tcmToSnake(o: TCMOutput) {
  return {
    thermal: o.thermal,
    element: o.element,
    organ_clock: o.organClock,
    plain_english: o.plainEnglish,
  };
}

function naturopathyToSnake(o: NaturopathyOutput) {
  return {
    evidence_level: o.evidenceLevel,
    pubmed_citations: o.pubmedCitations,
    honest_gaps: o.honestGaps,
    plain_english: o.plainEnglish,
  };
}

function synthesisToSnake(o: SynthesisOutput) {
  return {
    convergence_framing: o.convergenceFraming,
    two_sentence_rationale: o.twoSentenceRationale,
  };
}

// ---------------------------------------------------------------------------
// Tests: isMockMode
// ---------------------------------------------------------------------------

describe('isMockMode', () => {
  const originalEnv = process.env.TRIVEDA_LLM_MODE;

  afterEach(() => {
    if (originalEnv === undefined) {
      process.env.TRIVEDA_LLM_MODE = undefined;
    } else {
      process.env.TRIVEDA_LLM_MODE = originalEnv;
    }
  });

  it('returns true when TRIVEDA_LLM_MODE=mock', () => {
    process.env.TRIVEDA_LLM_MODE = 'mock';
    expect(isMockMode()).toBe(true);
  });

  it('returns false when TRIVEDA_LLM_MODE is not mock', () => {
    process.env.TRIVEDA_LLM_MODE = 'live';
    expect(isMockMode()).toBe(false);
  });

  it('returns false when TRIVEDA_LLM_MODE is unset', () => {
    process.env.TRIVEDA_LLM_MODE = undefined;
    expect(isMockMode()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Tests: getMockResponse
// ---------------------------------------------------------------------------

describe('getMockResponse', () => {
  it('returns fixture data for ayurveda', async () => {
    const result = await getMockResponse<AyurvedaOutput>('ayurveda');
    expect(result.output.rasa).toBeTruthy();
    expect(result.output.virya).toBeTruthy();
    expect(result.output.doshaRationale).toBeTruthy();
    expect(result.output.plainEnglish).toBeTruthy();
  });

  it('returns fixture data for tcm', async () => {
    const result = await getMockResponse<TCMOutput>('tcm');
    expect(result.output.thermal).toBeTruthy();
    expect(result.output.element).toBeTruthy();
    expect(result.output.organClock).toBeTruthy();
    expect(result.output.plainEnglish).toBeTruthy();
  });

  it('returns fixture data for naturopathy', async () => {
    const result = await getMockResponse<NaturopathyOutput>('naturopathy');
    expect(result.output.evidenceLevel).toBeTruthy();
    expect(result.output.pubmedCitations.length).toBeGreaterThan(0);
    expect(result.output.honestGaps.length).toBeGreaterThan(0);
    expect(result.output.plainEnglish).toBeTruthy();
  });

  it('returns fixture data for synthesis (convergent by default)', async () => {
    const result = await getMockResponse<SynthesisOutput>('synthesis');
    expect(result.output.convergenceFraming).toBeTruthy();
    expect(result.output.twoSentenceRationale).toBeTruthy();
  });

  it('returns divergent synthesis when configured', async () => {
    const result = await getMockResponse<SynthesisOutput>('synthesis', {
      divergentSynthesis: true,
    });
    expect(result.output.convergenceFraming).toContain('different perspectives');
  });

  it('returns data in under 50ms with no delay configured', async () => {
    const start = performance.now();
    await getMockResponse<AyurvedaOutput>('ayurveda');
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
  });

  it('makes zero HTTP/network calls', async () => {
    const fetchSpy = spyOn(globalThis, 'fetch');

    await getMockResponse<AyurvedaOutput>('ayurveda');
    await getMockResponse<TCMOutput>('tcm');
    await getMockResponse<NaturopathyOutput>('naturopathy');
    await getMockResponse<SynthesisOutput>('synthesis');

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('simulates delay when delayMs is configured', async () => {
    const start = performance.now();
    await getMockResponse<AyurvedaOutput>('ayurveda', { delayMs: 50 });
    const elapsed = performance.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(45); // allow small timing variance
  });

  it('includes correct model in metadata', async () => {
    const ayur = await getMockResponse<AyurvedaOutput>('ayurveda');
    expect(ayur.metadata.model).toBe('claude-sonnet-4-6');

    const nat = await getMockResponse<NaturopathyOutput>('naturopathy');
    expect(nat.metadata.model).toBe('gemini-2.5-flash');
  });

  it('includes zero cost in mock metadata', async () => {
    const result = await getMockResponse<AyurvedaOutput>('ayurveda');
    expect(result.metadata.costUsd).toBe(0);
    expect(result.metadata.latencyTotalMs).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Tests: Zod schema validation of mock outputs
// ---------------------------------------------------------------------------

describe('mock output Zod validation', () => {
  it('ayurveda mock output passes Zod schema', async () => {
    const result = await getMockResponse<AyurvedaOutput>('ayurveda');
    const parsed = ayurvedaOutputSchema.safeParse(ayurvedaToSnake(result.output));
    expect(parsed.success).toBe(true);
  });

  it('tcm mock output passes Zod schema', async () => {
    const result = await getMockResponse<TCMOutput>('tcm');
    const parsed = tcmOutputSchema.safeParse(tcmToSnake(result.output));
    expect(parsed.success).toBe(true);
  });

  it('naturopathy mock output passes Zod schema', async () => {
    const result = await getMockResponse<NaturopathyOutput>('naturopathy');
    const parsed = naturopathyOutputSchema.safeParse(naturopathyToSnake(result.output));
    expect(parsed.success).toBe(true);
  });

  it('synthesis mock output passes Zod schema', async () => {
    const result = await getMockResponse<SynthesisOutput>('synthesis');
    const parsed = synthesisOutputSchema.safeParse(synthesisToSnake(result.output));
    expect(parsed.success).toBe(true);
  });

  it('divergent synthesis mock output passes Zod schema', async () => {
    const result = await getMockResponse<SynthesisOutput>('synthesis', {
      divergentSynthesis: true,
    });
    const parsed = synthesisOutputSchema.safeParse(synthesisToSnake(result.output));
    expect(parsed.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Tests: getMockOutputs
// ---------------------------------------------------------------------------

describe('getMockOutputs', () => {
  it('returns a map containing all traditions', () => {
    const outputs = getMockOutputs();
    expect(outputs.ayurveda).toBeDefined();
    expect(outputs.tcm).toBeDefined();
    expect(outputs.naturopathy).toBeDefined();
    expect(outputs.synthesis).toBeDefined();
    expect(outputs['synthesis-converge']).toBeDefined();
    expect(outputs['synthesis-diverge']).toBeDefined();
  });

  it('returns a copy (not the internal map)', () => {
    const outputs1 = getMockOutputs();
    const outputs2 = getMockOutputs();
    expect(outputs1).not.toBe(outputs2);
    expect(outputs1).toEqual(outputs2);
  });
});
