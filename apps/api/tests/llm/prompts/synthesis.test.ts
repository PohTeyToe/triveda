import { describe, expect, it } from 'bun:test';
import type {
  AyurvedaOutput,
  NaturopathyOutput,
  SynthesisInput,
  TCMOutput,
} from '@triveda/shared/llm/types.js';
import { buildSystemPrompt, buildUserPrompt } from '../../../src/llm/prompts/v1/synthesis.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ayurvedaOutput: AyurvedaOutput = {
  rasa: 'sweet',
  virya: 'cooling',
  vipaka: 'sweet',
  doshaRationale: 'Sweet rasa pacifies Vata and Pitta doshas.',
  plainEnglish: 'This food is cooling and helps calm anxiety.',
};

const tcmOutput: TCMOutput = {
  thermal: 'warm',
  element: 'earth',
  organClock: 'Aligns with spleen meridian (9-11am).',
  plainEnglish: 'Warm food supports spleen energy in the morning.',
};

const naturopathyOutput: NaturopathyOutput = {
  evidenceLevel: 'moderate',
  pubmedCitations: [{ claim: 'Reduces CRP levels', source: 'PMC1234567', year: 2023 }],
  honestGaps: ['Long-term effects unstudied'],
  plainEnglish: 'Moderate evidence supports anti-inflammatory benefits.',
};

const baseSynthesisInput: SynthesisInput = {
  ayurvedaOutput,
  tcmOutput,
  naturopathyOutput,
  convergenceFlag: true,
  convergenceDimensions: {
    thermal: 'agree',
    constitutional: 'agree',
    seasonal: 'agree',
    evidence: 'agree',
  },
  selectedFoodName: 'Oatmeal',
  selectedFoodId: 'food-001',
  creditSources: [],
};

// ---------------------------------------------------------------------------
// System prompt tests
// ---------------------------------------------------------------------------

describe('Synthesis buildSystemPrompt', () => {
  const systemPrompt = buildSystemPrompt();

  it('contains "you are reporting, not computing" instruction', () => {
    expect(systemPrompt.toLowerCase()).toContain('reporting');
    expect(systemPrompt.toLowerCase()).toContain('not computing');
  });

  it('describes convergence_framing output field', () => {
    expect(systemPrompt).toContain('convergence_framing');
  });

  it('describes two_sentence_rationale output field', () => {
    expect(systemPrompt).toContain('two_sentence_rationale');
  });
});

// ---------------------------------------------------------------------------
// User prompt tests
// ---------------------------------------------------------------------------

describe('Synthesis buildUserPrompt', () => {
  it('includes deterministic convergence flag as literal boolean', () => {
    const userPrompt = buildUserPrompt(baseSynthesisInput);
    expect(userPrompt).toContain('Convergence Flag: true');
  });

  it('includes convergence flag false when not converging', () => {
    const divergent = { ...baseSynthesisInput, convergenceFlag: false };
    const userPrompt = buildUserPrompt(divergent);
    expect(userPrompt).toContain('Convergence Flag: false');
  });

  it('includes all three tradition outputs when available', () => {
    const userPrompt = buildUserPrompt(baseSynthesisInput);
    // Ayurveda
    expect(userPrompt).toContain('Ayurveda Tradition Output');
    expect(userPrompt).toContain('sweet');
    expect(userPrompt).toContain('doshaRationale');
    // TCM
    expect(userPrompt).toContain('TCM Tradition Output');
    expect(userPrompt).toContain('earth');
    // Naturopathy
    expect(userPrompt).toContain('Naturopathy Tradition Output');
    expect(userPrompt).toContain('PMC1234567');
  });

  it('handles null tradition outputs (marks as unavailable)', () => {
    const partial: SynthesisInput = {
      ...baseSynthesisInput,
      ayurvedaOutput: null,
      tcmOutput: null,
      naturopathyOutput: null,
    };
    const userPrompt = buildUserPrompt(partial);
    expect(userPrompt).toContain('unavailable');
    // Should have three unavailable markers
    const matches = userPrompt.match(/unavailable/g);
    expect(matches).not.toBeNull();
    expect(matches?.length).toBe(3);
  });

  it('includes convergence dimensions', () => {
    const userPrompt = buildUserPrompt(baseSynthesisInput);
    expect(userPrompt).toContain('Thermal: agree');
    expect(userPrompt).toContain('Constitutional: agree');
    expect(userPrompt).toContain('Seasonal: agree');
    expect(userPrompt).toContain('Evidence: agree');
  });

  it('includes selected food name', () => {
    const userPrompt = buildUserPrompt(baseSynthesisInput);
    expect(userPrompt).toContain('Oatmeal');
  });

  it('includes mixed convergence dimensions', () => {
    const mixed: SynthesisInput = {
      ...baseSynthesisInput,
      convergenceFlag: false,
      convergenceDimensions: {
        thermal: 'disagree',
        constitutional: 'agree',
        seasonal: 'neutral',
        evidence: 'disagree',
      },
    };
    const userPrompt = buildUserPrompt(mixed);
    expect(userPrompt).toContain('Thermal: disagree');
    expect(userPrompt).toContain('Constitutional: agree');
    expect(userPrompt).toContain('Seasonal: neutral');
    expect(userPrompt).toContain('Evidence: disagree');
  });
});
