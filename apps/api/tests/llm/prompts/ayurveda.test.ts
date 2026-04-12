import { describe, expect, it } from 'bun:test';
import type { AyurvedaInput } from '@triveda/shared/llm/types.js';
import {
  type AyurvedaFoodFactSheet,
  buildSystemPrompt,
  buildUserPrompt,
  sanitizeUserInput,
} from '../../../src/llm/prompts/v1/ayurveda.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const oatmealFactSheet: AyurvedaFoodFactSheet = {
  foodName: 'Oatmeal',
  rasa: 'sweet',
  virya: 'cooling',
  vipaka: 'sweet',
  guna: ['guru', 'snigdha'],
  doshaEffects: { vata: -1, pitta: -1, kapha: 1 },
  seasonalFitScores: {
    vasanta: 0.6,
    grishma: 0.8,
    varsha: 0.5,
    sharad: 0.7,
    hemanta: 0.9,
    shishira: 0.85,
  },
};

const sampleInput: AyurvedaInput = {
  foodProperties: {
    rasa: 'sweet',
    virya: 'cooling',
    vipaka: 'sweet',
    guna: ['guru', 'snigdha'],
    doshaEffects: { vata: -1, pitta: -1, kapha: 1 },
  },
  doshaProfile: { vata: 0.45, pitta: 0.35, kapha: 0.2 },
  seasonalContext: { currentRitu: 'vasanta', sandhiKala: false },
  weatherAggravation: { vata: 0.3, pitta: 0.2, kapha: 0.1 },
  recentFoodFeedback: [{ foodId: 'food-001', accepted: true, date: '2026-04-10' }],
  creditSources: [],
};

// ---------------------------------------------------------------------------
// System prompt tests
// ---------------------------------------------------------------------------

describe('Ayurveda buildSystemPrompt', () => {
  const systemPrompt = buildSystemPrompt(oatmealFactSheet);

  it('includes rasa/virya/vipaka terminology', () => {
    expect(systemPrompt).toContain('rasa');
    expect(systemPrompt).toContain('virya');
    expect(systemPrompt).toContain('vipaka');
  });

  it('does NOT contain TCM terms', () => {
    expect(systemPrompt).not.toContain('organ clock');
    expect(systemPrompt).not.toContain('Five Element');
    expect(systemPrompt).not.toContain('thermal nature');
    expect(systemPrompt).not.toContain('meridian');
  });

  it('does NOT contain Naturopathy terms', () => {
    expect(systemPrompt).not.toContain('evidence level');
    expect(systemPrompt).not.toContain('PubMed');
    expect(systemPrompt).not.toContain('clinical trial');
  });

  it('includes food fact sheet data from input', () => {
    expect(systemPrompt).toContain('Oatmeal');
    expect(systemPrompt).toContain('sweet');
    expect(systemPrompt).toContain('cooling');
    expect(systemPrompt).toContain('guru');
    expect(systemPrompt).toContain('snigdha');
  });

  it('includes dosha effect indicators', () => {
    expect(systemPrompt).toContain('pacifies');
    expect(systemPrompt).toContain('aggravates');
  });

  it('includes seasonal fit scores', () => {
    expect(systemPrompt).toContain('vasanta');
    expect(systemPrompt).toContain('hemanta');
  });

  it('exceeds 2048 characters with food data (cache eligibility)', () => {
    // System prompt with food data should be substantial enough for caching
    expect(systemPrompt.length).toBeGreaterThan(2048);
  });

  it('references Charaka Samhita', () => {
    expect(systemPrompt).toContain('Charaka Samhita');
  });

  it('references Ashtanga Hridaya', () => {
    expect(systemPrompt).toContain('Ashtanga Hridaya');
  });
});

// ---------------------------------------------------------------------------
// User prompt tests
// ---------------------------------------------------------------------------

describe('Ayurveda buildUserPrompt', () => {
  it('includes user dosha profile', () => {
    const userPrompt = buildUserPrompt(sampleInput);
    expect(userPrompt).toContain('Vata: 0.45');
    expect(userPrompt).toContain('Pitta: 0.35');
    expect(userPrompt).toContain('Kapha: 0.2');
  });

  it('includes seasonal Ritu context', () => {
    const userPrompt = buildUserPrompt(sampleInput);
    expect(userPrompt).toContain('vasanta');
    expect(userPrompt).toContain('Sandhi Kala');
  });

  it('includes weather aggravation', () => {
    const userPrompt = buildUserPrompt(sampleInput);
    expect(userPrompt).toContain('Vata aggravation: 0.3');
  });

  it('includes recent food feedback', () => {
    const userPrompt = buildUserPrompt(sampleInput);
    expect(userPrompt).toContain('food-001');
    expect(userPrompt).toContain('accepted');
  });

  it('wraps user-provided text in <user_input> tags', () => {
    const userPrompt = buildUserPrompt(sampleInput, 'I prefer warm foods');
    expect(userPrompt).toContain('<user_input>I prefer warm foods</user_input>');
  });

  it('applies sanitization to user text', () => {
    const userPrompt = buildUserPrompt(sampleInput, 'Hello <script>alert("xss")</script> world');
    expect(userPrompt).not.toContain('<script>');
    expect(userPrompt).toContain('Hello');
    expect(userPrompt).toContain('world');
  });

  it('omits user input section when no text provided', () => {
    const userPrompt = buildUserPrompt(sampleInput);
    expect(userPrompt).not.toContain('<user_input>');
  });

  it('omits food feedback section when array is empty', () => {
    const noFeedback = { ...sampleInput, recentFoodFeedback: [] };
    const userPrompt = buildUserPrompt(noFeedback);
    expect(userPrompt).not.toContain('Recent Food Feedback');
  });
});

// ---------------------------------------------------------------------------
// Sanitization tests
// ---------------------------------------------------------------------------

describe('sanitizeUserInput', () => {
  it('strips XML-like tags', () => {
    expect(sanitizeUserInput('<script>bad</script>')).toBe('bad');
  });

  it('trims whitespace', () => {
    expect(sanitizeUserInput('  hello  ')).toBe('hello');
  });

  it('passes through normal text unchanged', () => {
    expect(sanitizeUserInput('I like oatmeal')).toBe('I like oatmeal');
  });
});
