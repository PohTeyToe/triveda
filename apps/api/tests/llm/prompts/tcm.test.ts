import { describe, expect, it } from 'bun:test';
import type { TCMInput } from '@triveda/shared/llm/types.js';
import {
  type TCMFoodFactSheet,
  buildSystemPrompt,
  buildUserPrompt,
} from '../../../src/llm/prompts/v1/tcm.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const gingerFactSheet: TCMFoodFactSheet = {
  foodName: 'Ginger',
  thermalNature: 'warm',
  flavors: ['pungent'],
  organAffinities: ['spleen', 'stomach', 'lung'],
  elementFitScores: {
    wood: 0.1,
    fire: 0.3,
    earth: 0.6,
    metal: 0.2,
    water: 0.1,
  },
};

const sampleInput: TCMInput = {
  foodThermalNature: 'warm',
  flavors: ['pungent'],
  organAffinities: ['spleen', 'stomach'],
  fiveElementScores: { wood: 0.1, fire: 0.3, earth: 0.6, metal: 0.2, water: 0.1 },
  organClockHour: 9,
  dominantOrgan: 'spleen',
  userElementType: { wood: 0.4, fire: 0.3, earth: 0.15, metal: 0.1, water: 0.05 },
  seasonalTCMPhase: 'wood',
  creditSources: [],
};

// ---------------------------------------------------------------------------
// System prompt tests
// ---------------------------------------------------------------------------

describe('TCM buildSystemPrompt', () => {
  const systemPrompt = buildSystemPrompt(gingerFactSheet);

  it('includes organ clock / Five Element terminology', () => {
    expect(systemPrompt).toContain('organ clock');
    expect(systemPrompt).toContain('Five Element');
    expect(systemPrompt).toContain('thermal nature');
  });

  it('does NOT contain Ayurveda terms', () => {
    expect(systemPrompt).not.toContain('dosha');
    expect(systemPrompt).not.toContain('rasa');
    expect(systemPrompt).not.toContain('virya');
    expect(systemPrompt).not.toContain('vipaka');
    expect(systemPrompt).not.toContain('Ritucharya');
  });

  it('does NOT contain Naturopathy terms', () => {
    expect(systemPrompt).not.toContain('evidence level');
    expect(systemPrompt).not.toContain('PubMed');
    expect(systemPrompt).not.toContain('clinical trial');
  });

  it('includes food fact sheet data', () => {
    expect(systemPrompt).toContain('Ginger');
    expect(systemPrompt).toContain('warm');
    expect(systemPrompt).toContain('pungent');
    expect(systemPrompt).toContain('spleen');
  });

  it('references Huang Di Nei Jing', () => {
    expect(systemPrompt).toContain('Huang Di Nei Jing');
  });

  it('references Bencao Gangmu', () => {
    expect(systemPrompt).toContain('Bencao Gangmu');
  });

  it('includes Five Element fit scores', () => {
    expect(systemPrompt).toContain('Earth: 0.6');
  });
});

// ---------------------------------------------------------------------------
// User prompt tests
// ---------------------------------------------------------------------------

describe('TCM buildUserPrompt', () => {
  it('includes current organ hour and dominant organ', () => {
    const userPrompt = buildUserPrompt(sampleInput);
    expect(userPrompt).toContain('9:00');
    expect(userPrompt).toContain('spleen');
  });

  it('includes user Element type', () => {
    const userPrompt = buildUserPrompt(sampleInput);
    expect(userPrompt).toContain('Wood: 0.4');
    expect(userPrompt).toContain('Fire: 0.3');
    expect(userPrompt).toContain('Earth: 0.15');
  });

  it('includes seasonal TCM phase', () => {
    const userPrompt = buildUserPrompt(sampleInput);
    expect(userPrompt).toContain('wood');
  });

  it('wraps user text in <user_input> tags', () => {
    const userPrompt = buildUserPrompt(sampleInput, 'Feeling cold today');
    expect(userPrompt).toContain('<user_input>Feeling cold today</user_input>');
  });

  it('omits user input section when no text provided', () => {
    const userPrompt = buildUserPrompt(sampleInput);
    expect(userPrompt).not.toContain('<user_input>');
  });
});
