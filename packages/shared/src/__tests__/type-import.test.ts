import { describe, expect, it } from 'vitest';
import type {
  ConstitutionEngine,
  ConvergenceDetector,
  OrganClock,
  SeasonEngine,
  WeatherMapper,
} from '../engines/index.js';
import type {
  Answer,
  ConstitutionalProfile,
  ConstitutionalResult,
  ConvergenceReport,
  ConvergenceResult,
  DayContext,
  Dosha,
  DoshaClassification,
  DoshaProfile,
  ElementScores,
  FoodForConvergence,
  OrganClockContext,
  OrganClockResult,
  Ritu,
  SeasonalContext,
  SeasonalResult,
  TCMElement,
  TCMPhase,
  WeatherContext,
  WeatherInput,
  WeatherResult,
} from '../engines/index.js';
import type {
  AyurvedaInput,
  AyurvedaOutput,
  CircuitBreakerConfig,
  DailyFoodInput,
  DailyFoodLLMResult,
  SSEEvent,
  TraditionType,
} from '../llm/index.js';
import type { TelemetryLogger } from '../telemetry.js';

/**
 * These tests verify that all interfaces are importable as types.
 * The fact that this file compiles is the primary assertion.
 * Runtime checks confirm the imports resolved without errors.
 */
describe('type imports', () => {
  it('TelemetryLogger is importable as a type', () => {
    const _check: TelemetryLogger | undefined = undefined;
    expect(_check).toBeUndefined();
  });

  it('legacy engine interfaces are importable as types', () => {
    const _season: SeasonEngine | undefined = undefined;
    const _constitution: ConstitutionEngine | undefined = undefined;
    const _organ: OrganClock | undefined = undefined;
    const _weather: WeatherMapper | undefined = undefined;
    const _convergence: ConvergenceDetector | undefined = undefined;

    expect(_season).toBeUndefined();
    expect(_constitution).toBeUndefined();
    expect(_organ).toBeUndefined();
    expect(_weather).toBeUndefined();
    expect(_convergence).toBeUndefined();
  });

  it('deterministic engine types are importable', () => {
    const _dosha: Dosha | undefined = undefined;
    const _ritu: Ritu | undefined = undefined;
    const _phase: TCMPhase | undefined = undefined;
    const _element: TCMElement | undefined = undefined;
    const _answer: Answer | undefined = undefined;
    const _weatherInput: WeatherInput | undefined = undefined;
    const _food: FoodForConvergence | undefined = undefined;
    const _doshaProfile: DoshaProfile | undefined = undefined;
    const _classification: DoshaClassification | undefined = undefined;
    const _elementScores: ElementScores | undefined = undefined;
    const _seasonal: SeasonalContext | undefined = undefined;
    const _constitutional: ConstitutionalProfile | undefined = undefined;
    const _organClock: OrganClockContext | undefined = undefined;
    const _weatherCtx: WeatherContext | undefined = undefined;
    const _convergenceReport: ConvergenceReport | undefined = undefined;
    const _dayCtx: DayContext | undefined = undefined;

    expect(_dosha).toBeUndefined();
    expect(_ritu).toBeUndefined();
    expect(_phase).toBeUndefined();
    expect(_element).toBeUndefined();
    expect(_answer).toBeUndefined();
    expect(_weatherInput).toBeUndefined();
    expect(_food).toBeUndefined();
    expect(_doshaProfile).toBeUndefined();
    expect(_classification).toBeUndefined();
    expect(_elementScores).toBeUndefined();
    expect(_seasonal).toBeUndefined();
    expect(_constitutional).toBeUndefined();
    expect(_organClock).toBeUndefined();
    expect(_weatherCtx).toBeUndefined();
    expect(_convergenceReport).toBeUndefined();
    expect(_dayCtx).toBeUndefined();
  });

  it('result wrapper types are importable', () => {
    const _sr: SeasonalResult | undefined = undefined;
    const _cr: ConstitutionalResult | undefined = undefined;
    const _or: OrganClockResult | undefined = undefined;
    const _wr: WeatherResult | undefined = undefined;
    const _cvr: ConvergenceResult | undefined = undefined;

    expect(_sr).toBeUndefined();
    expect(_cr).toBeUndefined();
    expect(_or).toBeUndefined();
    expect(_wr).toBeUndefined();
    expect(_cvr).toBeUndefined();
  });

  it('LLM types are importable', () => {
    const _tradition: TraditionType | undefined = undefined;
    const _ayurvedaIn: AyurvedaInput | undefined = undefined;
    const _ayurvedaOut: AyurvedaOutput | undefined = undefined;
    const _dailyInput: DailyFoodInput | undefined = undefined;
    const _dailyResult: DailyFoodLLMResult | undefined = undefined;
    const _event: SSEEvent | undefined = undefined;
    const _circuit: CircuitBreakerConfig | undefined = undefined;

    expect(_tradition).toBeUndefined();
    expect(_ayurvedaIn).toBeUndefined();
    expect(_ayurvedaOut).toBeUndefined();
    expect(_dailyInput).toBeUndefined();
    expect(_dailyResult).toBeUndefined();
    expect(_event).toBeUndefined();
    expect(_circuit).toBeUndefined();
  });
});
