import { describe, expect, it } from 'vitest';
import type {
  AyurvedaInput,
  AyurvedaOutput,
  CallMetadata,
  CircuitBreakerConfig,
  CostEstimate,
  DailyFoodInput,
  NaturopathyInput,
  NaturopathyOutput,
  OrchestrationMetadata,
  ProviderDegradationEvent,
  SSEEvent,
  SynthesisInput,
  SynthesisOutput,
  TCMInput,
  TCMOutput,
  TraditionCallResult,
  TraditionType,
} from '../types.js';
import { DEFAULT_PROVIDER_MAP, TraditionCallError } from '../types.js';

/**
 * Compile-time type assertion tests.
 *
 * If this file compiles and runs without type errors, the types are
 * correctly defined. Runtime assertions verify assignability.
 */

describe('LLM types -- compile-time assertions', () => {
  it('DailyFoodInput type compiles with all required fields', () => {
    const input: DailyFoodInput = {
      requestId: '550e8400-e29b-41d4-a716-446655440000',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      ayurveda: {
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
        recentFoodFeedback: [],
        creditSources: [],
      },
      tcm: {
        foodThermalNature: 'warm',
        flavors: ['sweet'],
        organAffinities: ['spleen', 'stomach'],
        fiveElementScores: { wood: 0.1, fire: 0.2, earth: 0.5, metal: 0.1, water: 0.1 },
        organClockHour: 9,
        dominantOrgan: 'spleen',
        userElementType: { wood: 0.4, fire: 0.3, earth: 0.15, metal: 0.1, water: 0.05 },
        seasonalTCMPhase: 'wood',
        creditSources: [],
      },
      naturopathy: {
        nutritionalData: {
          macros: { protein: 5, carbs: 27, fat: 3, fiber: 4 },
          keyMicronutrients: ['iron', 'magnesium'],
          glycemicIndex: 55,
        },
        bioactiveCompounds: [{ name: 'beta-glucan', amount: '4g' }],
        evidenceClaims: [
          { claim: 'Lowers cholesterol', evidenceLevel: 'strong', source: 'PMC1234' },
        ],
        creditSources: [],
      },
      synthesis: {
        ayurvedaOutput: null,
        tcmOutput: null,
        naturopathyOutput: null,
        convergenceFlag: false,
        convergenceDimensions: {
          thermal: 'neutral',
          constitutional: 'neutral',
          seasonal: 'neutral',
          evidence: 'neutral',
        },
        selectedFoodName: 'Oatmeal',
        selectedFoodId: 'food-001',
        creditSources: [],
      },
    };
    expect(input.requestId).toBeTruthy();
  });

  it('AyurvedaInput type requires dosha profile', () => {
    const input: AyurvedaInput = {
      foodProperties: {
        rasa: 'bitter',
        virya: 'heating',
        vipaka: 'pungent',
        guna: ['laghu'],
        doshaEffects: { vata: 0, pitta: 1, kapha: -1 },
      },
      doshaProfile: { vata: 0.3, pitta: 0.5, kapha: 0.2 },
      seasonalContext: { currentRitu: 'grishma', sandhiKala: false },
      weatherAggravation: { vata: 0, pitta: 0.5, kapha: 0 },
      recentFoodFeedback: [{ foodId: 'food-001', accepted: true, date: '2026-04-10' }],
      creditSources: [],
    };
    expect(input.doshaProfile).toBeDefined();
  });

  it('TCMInput type requires organ clock hour', () => {
    const input: TCMInput = {
      foodThermalNature: 'cool',
      flavors: ['sour', 'sweet'],
      organAffinities: ['liver'],
      fiveElementScores: { wood: 0.5, fire: 0.1, earth: 0.2, metal: 0.1, water: 0.1 },
      organClockHour: 3,
      dominantOrgan: 'liver',
      userElementType: { wood: 0.3, fire: 0.2, earth: 0.2, metal: 0.15, water: 0.15 },
      seasonalTCMPhase: 'wood',
      creditSources: [],
    };
    expect(input.organClockHour).toBe(3);
  });

  it('NaturopathyInput type requires evidence claims array', () => {
    const input: NaturopathyInput = {
      nutritionalData: {
        macros: { protein: 10, carbs: 20, fat: 5, fiber: 3 },
        keyMicronutrients: ['zinc'],
        glycemicIndex: 40,
      },
      bioactiveCompounds: [],
      evidenceClaims: [
        { claim: 'Supports immune function', evidenceLevel: 'moderate', source: 'PMC5678' },
      ],
      creditSources: [],
    };
    expect(input.evidenceClaims.length).toBe(1);
  });

  it('SynthesisInput accepts null tradition outputs (for failed traditions)', () => {
    const input: SynthesisInput = {
      ayurvedaOutput: null,
      tcmOutput: null,
      naturopathyOutput: null,
      convergenceFlag: false,
      convergenceDimensions: {
        thermal: 'neutral',
        constitutional: 'neutral',
        seasonal: 'neutral',
        evidence: 'neutral',
      },
      selectedFoodName: 'Turmeric',
      selectedFoodId: 'food-002',
      creditSources: [],
    };
    expect(input.ayurvedaOutput).toBeNull();
    expect(input.tcmOutput).toBeNull();
    expect(input.naturopathyOutput).toBeNull();
  });
});

describe('TraditionCallError', () => {
  it('carries structured context', () => {
    const err = new TraditionCallError({
      tradition: 'ayurveda',
      cause: 'provider_error',
      message: 'Claude returned 500',
      model: 'claude-sonnet-4-6',
      rawResponse: '{"error": "internal"}',
    });
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('TraditionCallError');
    expect(err.tradition).toBe('ayurveda');
    expect(err.cause).toBe('provider_error');
    expect(err.model).toBe('claude-sonnet-4-6');
    expect(err.rawResponse).toBe('{"error": "internal"}');
    expect(err.zodError).toBeUndefined();
  });
});

describe('DEFAULT_PROVIDER_MAP', () => {
  it('maps ayurveda to anthropic', () => {
    expect(DEFAULT_PROVIDER_MAP.ayurveda.provider).toBe('anthropic');
    expect(DEFAULT_PROVIDER_MAP.ayurveda.model).toBe('claude-sonnet-4-6');
  });

  it('maps tcm to anthropic', () => {
    expect(DEFAULT_PROVIDER_MAP.tcm.provider).toBe('anthropic');
  });

  it('maps naturopathy to google-vertex', () => {
    expect(DEFAULT_PROVIDER_MAP.naturopathy.provider).toBe('google-vertex');
    expect(DEFAULT_PROVIDER_MAP.naturopathy.model).toBe('gemini-2.5-flash');
  });

  it('maps synthesis to anthropic', () => {
    expect(DEFAULT_PROVIDER_MAP.synthesis.provider).toBe('anthropic');
  });
});

describe('SSEEvent type union -- compile-time', () => {
  it('accepts tradition_start event', () => {
    const event: SSEEvent = {
      type: 'tradition_start',
      requestId: 'req-001',
      timestamp: Date.now(),
      tradition: 'ayurveda',
      model: 'claude-sonnet-4-6',
    };
    expect(event.type).toBe('tradition_start');
  });

  it('accepts orchestration_complete event', () => {
    const event: SSEEvent = {
      type: 'orchestration_complete',
      requestId: 'req-001',
      timestamp: Date.now(),
      result: {
        ayurveda: null,
        tcm: null,
        naturopathy: null,
        synthesis: null,
        metadata: {
          requestId: 'req-001',
          totalLatencyMs: 1500,
          perTraditionLatency: { ayurveda: 500, tcm: 400, naturopathy: 300, synthesis: 300 },
          totalCostUsd: 0.01,
          perTraditionCost: { ayurveda: 0.003, tcm: 0.003, naturopathy: 0.001, synthesis: 0.003 },
          failedTraditions: [],
          degradationEvents: [],
          creditSources: [],
        },
      },
    };
    expect(event.type).toBe('orchestration_complete');
  });
});

describe('CircuitBreakerConfig -- compile-time', () => {
  it('accepts all required fields', () => {
    const config: CircuitBreakerConfig = {
      failureThreshold: 5,
      resetTimeoutMs: 30_000,
      halfOpenSuccessThreshold: 2,
    };
    expect(config.failureThreshold).toBe(5);
  });
});

describe('CostEstimate -- compile-time', () => {
  it('accepts all required fields', () => {
    const estimate: CostEstimate = {
      tradition: 'ayurveda',
      model: 'claude-sonnet-4-6',
      estimatedTokensIn: 2000,
      estimatedTokensOut: 500,
      estimatedCostUsd: 0.013,
    };
    expect(estimate.tradition).toBe('ayurveda');
  });
});
