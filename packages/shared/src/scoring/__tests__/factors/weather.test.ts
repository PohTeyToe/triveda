import { describe, expect, it } from 'vitest';
import { THERMAL_VALUES } from '../../factors/constants.js';
import { weatherScore } from '../../factors/weather.js';
import type { FoodTCM, TCMElement, ThermalNature, WeatherContext } from '../../types.js';

function makeTCM(thermalNature: ThermalNature): FoodTCM {
  const elementFit: Record<TCMElement, number> = {
    wood: 0.5,
    fire: 0.5,
    earth: 0.5,
    metal: 0.5,
    water: 0.5,
  };
  return { thermalNature, organAffinity: [], elementFit };
}

function makeWeather(thermalNeed: number): WeatherContext {
  return {
    thermalNeed,
    kaphaAggravation: 0,
    vataAggravation: 0,
    pittaAggravation: 0,
    tcmWindPattern: 'none',
  };
}

describe('weatherScore', () => {
  it('thermalNeed=+1.0, food hot (+1.0) -> 1.0', () => {
    expect(weatherScore(makeTCM('hot'), makeWeather(1.0))).toBeCloseTo(1.0, 10);
  });

  it('thermalNeed=+1.0, food cold (-1.0) -> 0.0', () => {
    expect(weatherScore(makeTCM('cold'), makeWeather(1.0))).toBeCloseTo(0.0, 10);
  });

  it('thermalNeed=+1.0, food warm (+0.5) -> 0.75', () => {
    expect(weatherScore(makeTCM('warm'), makeWeather(1.0))).toBeCloseTo(0.75, 10);
  });

  it('thermalNeed=0.0, food neutral (0.0) -> 1.0', () => {
    expect(weatherScore(makeTCM('neutral'), makeWeather(0.0))).toBeCloseTo(1.0, 10);
  });

  it('thermalNeed=-1.0, food cool (-0.5) -> 0.75', () => {
    expect(weatherScore(makeTCM('cool'), makeWeather(-1.0))).toBeCloseTo(0.75, 10);
  });

  it('all 5 THERMAL_VALUES produce correct numeric mapping', () => {
    expect(THERMAL_VALUES.cold).toBe(-1.0);
    expect(THERMAL_VALUES.cool).toBe(-0.5);
    expect(THERMAL_VALUES.neutral).toBe(0.0);
    expect(THERMAL_VALUES.warm).toBe(0.5);
    expect(THERMAL_VALUES.hot).toBe(1.0);
  });

  it('score in [0, 1] for all thermal combinations', () => {
    const natures: ThermalNature[] = ['cold', 'cool', 'neutral', 'warm', 'hot'];
    const needs = [-1.0, -0.5, 0.0, 0.5, 1.0];

    for (const nature of natures) {
      for (const need of needs) {
        const score = weatherScore(makeTCM(nature), makeWeather(need));
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      }
    }
  });
});
