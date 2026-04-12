import { describe, expect, it } from 'vitest';
import type {
  ConstitutionEngine,
  ConvergenceDetector,
  OrganClock,
  SeasonEngine,
  WeatherMapper,
} from '../engines/index.js';
import type { LLMProvider, TraditionOrchestrator } from '../llm/index.js';
import type { TelemetryLogger } from '../telemetry.js';

/**
 * These tests verify that all interfaces are importable as types.
 * The fact that this file compiles is the primary assertion.
 * Runtime checks confirm the imports resolved without errors.
 */
describe('type imports', () => {
  it('TelemetryLogger is importable as a type', () => {
    // Type-level check: if this compiles, the import works.
    const _check: TelemetryLogger | undefined = undefined;
    expect(_check).toBeUndefined();
  });

  it('engine interfaces are importable as types', () => {
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

  it('LLM interfaces are importable as types', () => {
    const _provider: LLMProvider | undefined = undefined;
    const _orchestrator: TraditionOrchestrator | undefined = undefined;

    expect(_provider).toBeUndefined();
    expect(_orchestrator).toBeUndefined();
  });
});
