import { describe, expect, it } from 'bun:test';
import type { NaturopathyInput } from '@triveda/shared/llm/types.js';
import {
  type NaturopathyFoodFactSheet,
  buildSystemPrompt,
  buildUserPrompt,
} from '../../../src/llm/prompts/v1/naturopathy.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const turmericFactSheet: NaturopathyFoodFactSheet = {
  foodName: 'Turmeric',
  nutritionalData: {
    macros: { protein: 1, carbs: 7, fat: 0.3, fiber: 2 },
    keyMicronutrients: ['iron', 'manganese', 'potassium'],
    glycemicIndex: 15,
  },
  bioactiveCompounds: [
    { name: 'curcumin', amount: '3.14g per 100g' },
    { name: 'turmerone', amount: '0.5g per 100g' },
  ],
  evidenceClaims: [
    { claim: 'Reduces CRP levels', evidenceLevel: 'moderate', source: 'PMC1234567' },
    { claim: 'Anti-cancer properties', evidenceLevel: 'preliminary', source: 'PMC7654321' },
  ],
};

const sampleInput: NaturopathyInput = {
  nutritionalData: {
    macros: { protein: 1, carbs: 7, fat: 0.3, fiber: 2 },
    keyMicronutrients: ['iron', 'manganese'],
    glycemicIndex: 15,
  },
  bioactiveCompounds: [{ name: 'curcumin', amount: '3.14g per 100g' }],
  evidenceClaims: [
    { claim: 'Reduces CRP levels', evidenceLevel: 'moderate', source: 'PMC1234567' },
  ],
  userBiomarkers: [
    { name: 'CRP', value: 3.2, unit: 'mg/L' },
    { name: 'Vitamin D', value: 28, unit: 'ng/mL' },
  ],
  creditSources: [],
};

// ---------------------------------------------------------------------------
// System prompt tests
// ---------------------------------------------------------------------------

describe('Naturopathy buildSystemPrompt', () => {
  const systemPrompt = buildSystemPrompt(turmericFactSheet);

  it('includes evidence/clinical terminology', () => {
    expect(systemPrompt).toContain('evidence');
    expect(systemPrompt).toContain('PubMed');
    expect(systemPrompt).toContain('clinical');
  });

  it('does NOT contain Ayurveda terms', () => {
    expect(systemPrompt).not.toContain('dosha');
    expect(systemPrompt).not.toContain('rasa');
    expect(systemPrompt).not.toContain('virya');
    expect(systemPrompt).not.toContain('Ritucharya');
  });

  it('does NOT contain TCM terms', () => {
    expect(systemPrompt).not.toContain('organ clock');
    expect(systemPrompt).not.toContain('Five Element');
    expect(systemPrompt).not.toContain('meridian');
  });

  it('includes instruction about honest_gaps', () => {
    expect(systemPrompt).toContain('honest_gaps');
    expect(systemPrompt).toContain('at least one entry');
  });

  it('includes food fact sheet data', () => {
    expect(systemPrompt).toContain('Turmeric');
    expect(systemPrompt).toContain('curcumin');
    expect(systemPrompt).toContain('3.14g per 100g');
    expect(systemPrompt).toContain('PMC1234567');
  });

  it('includes nutritional data', () => {
    expect(systemPrompt).toContain('Protein: 1g');
    expect(systemPrompt).toContain('Glycemic Index: 15');
  });

  it('includes evidence claims', () => {
    expect(systemPrompt).toContain('Reduces CRP levels');
    expect(systemPrompt).toContain('moderate');
  });
});

// ---------------------------------------------------------------------------
// User prompt tests
// ---------------------------------------------------------------------------

describe('Naturopathy buildUserPrompt', () => {
  it('includes nutritional data', () => {
    const userPrompt = buildUserPrompt(sampleInput);
    expect(userPrompt).toContain('Protein: 1g');
    expect(userPrompt).toContain('Glycemic Index: 15');
  });

  it('includes bioactive compounds', () => {
    const userPrompt = buildUserPrompt(sampleInput);
    expect(userPrompt).toContain('curcumin');
    expect(userPrompt).toContain('3.14g per 100g');
  });

  it('includes user biomarkers when provided', () => {
    const userPrompt = buildUserPrompt(sampleInput);
    expect(userPrompt).toContain('CRP: 3.2 mg/L');
    expect(userPrompt).toContain('Vitamin D: 28 ng/mL');
  });

  it('omits biomarkers section when not provided', () => {
    const noBiomarkers = { ...sampleInput, userBiomarkers: undefined };
    const userPrompt = buildUserPrompt(noBiomarkers);
    expect(userPrompt).not.toContain('User Biomarkers');
  });

  it('wraps user text in <user_input> tags', () => {
    const userPrompt = buildUserPrompt(sampleInput, 'What about my CRP?');
    expect(userPrompt).toContain('<user_input>What about my CRP?</user_input>');
  });

  it('omits user input section when no text provided', () => {
    const userPrompt = buildUserPrompt(sampleInput);
    expect(userPrompt).not.toContain('<user_input>');
  });
});
