import { describe, expect, it } from 'vitest';
import {
  ayurvedaOutputSchema,
  naturopathyOutputSchema,
  synthesisOutputSchema,
  tcmOutputSchema,
} from '../prompts/v1/schemas.js';

describe('ayurvedaOutputSchema', () => {
  const validAyurveda = {
    rasa: 'sweet',
    virya: 'cooling',
    vipaka: 'sweet',
    dosha_rationale: 'Sweet rasa pacifies Vata and Pitta doshas.',
    plain_english: 'This food is cooling and helps calm anxiety.',
  };

  it('accepts valid output with all fields', () => {
    const result = ayurvedaOutputSchema.safeParse(validAyurveda);
    expect(result.success).toBe(true);
  });

  it('rejects missing rasa field', () => {
    const { rasa: _, ...noRasa } = validAyurveda;
    const result = ayurvedaOutputSchema.safeParse(noRasa);
    expect(result.success).toBe(false);
  });

  it('rejects extra unknown fields (strict mode)', () => {
    const withExtra = { ...validAyurveda, bonus_field: 'surprise' };
    const result = ayurvedaOutputSchema.safeParse(withExtra);
    expect(result.success).toBe(false);
  });
});

describe('tcmOutputSchema', () => {
  const validTCM = {
    thermal: 'warm',
    element: 'fire',
    organ_clock: 'Aligns with heart meridian (11am-1pm).',
    plain_english: 'This warm food supports heart energy at midday.',
  };

  it('accepts valid output with all fields', () => {
    const result = tcmOutputSchema.safeParse(validTCM);
    expect(result.success).toBe(true);
  });

  it('rejects missing thermal field', () => {
    const { thermal: _, ...noThermal } = validTCM;
    const result = tcmOutputSchema.safeParse(noThermal);
    expect(result.success).toBe(false);
  });
});

describe('naturopathyOutputSchema', () => {
  const validNaturopathy = {
    evidence_level: 'moderate' as const,
    pubmed_citations: [{ claim: 'Reduces CRP levels', source: 'PMC1234567', year: 2023 }],
    honest_gaps: ['Long-term effects unstudied'],
    plain_english: 'Moderate evidence supports anti-inflammatory benefits.',
  };

  it('accepts valid evidence_level enum values', () => {
    for (const level of ['strong', 'moderate', 'preliminary', 'traditional_only', 'none']) {
      const result = naturopathyOutputSchema.safeParse({
        ...validNaturopathy,
        evidence_level: level,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid evidence_level value', () => {
    const result = naturopathyOutputSchema.safeParse({
      ...validNaturopathy,
      evidence_level: 'unknown',
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty pubmed_citations array', () => {
    const result = naturopathyOutputSchema.safeParse({
      ...validNaturopathy,
      pubmed_citations: [],
    });
    expect(result.success).toBe(true);
  });

  it('validates citation objects have claim and source', () => {
    const result = naturopathyOutputSchema.safeParse({
      ...validNaturopathy,
      pubmed_citations: [{ claim: 'Test' }], // missing source
    });
    expect(result.success).toBe(false);
  });
});

describe('synthesisOutputSchema', () => {
  const validSynthesis = {
    convergence_framing: 'All three traditions agree this food is cooling and supportive.',
    two_sentence_rationale:
      'Oatmeal is grounding and easy to digest. All traditions recommend it for morning consumption.',
  };

  it('accepts valid convergence_framing and rationale', () => {
    const result = synthesisOutputSchema.safeParse(validSynthesis);
    expect(result.success).toBe(true);
  });

  it('rejects empty convergence_framing', () => {
    const result = synthesisOutputSchema.safeParse({
      ...validSynthesis,
      convergence_framing: '',
    });
    expect(result.success).toBe(false);
  });
});
