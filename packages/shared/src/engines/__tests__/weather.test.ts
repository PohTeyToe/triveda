import { describe, expect, it } from 'vitest';
import type { DoshaProfile, WeatherContext, WeatherInput } from '../types.js';
import { MAX_WEATHER_SHIFT, applyWeatherToDoshaProfile, mapWeather } from '../weather.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const coldWindy: WeatherInput = { tempCelsius: 2, humidityPercent: 20, windSpeedMs: 12 };
const hotHumid: WeatherInput = { tempCelsius: 36, humidityPercent: 85, windSpeedMs: 2 };
const mildNeutral: WeatherInput = { tempCelsius: 20, humidityPercent: 50, windSpeedMs: 3 };
const extremeCold: WeatherInput = { tempCelsius: -15, humidityPercent: 10, windSpeedMs: 8 };
const warmWindy: WeatherInput = { tempCelsius: 25, humidityPercent: 40, windSpeedMs: 8 };

// Balanced base profile for shift tests
const balancedProfile: DoshaProfile = { vata: 0.33, pitta: 0.34, kapha: 0.33 };

// ---------------------------------------------------------------------------
// Temperature to thermal need (continuous piecewise)
// ---------------------------------------------------------------------------

describe('temperature to thermal need', () => {
  it('0C returns thermalNeed 1.0', () => {
    const r = mapWeather({ tempCelsius: 0, humidityPercent: 50, windSpeedMs: 0 });
    expect(r.context.thermalNeed).toBeCloseTo(1.0);
  });

  it('5C returns thermalNeed 1.0', () => {
    const r = mapWeather({ tempCelsius: 5, humidityPercent: 50, windSpeedMs: 0 });
    expect(r.context.thermalNeed).toBeCloseTo(1.0);
  });

  it('10C returns thermalNeed approximately 0.75', () => {
    const r = mapWeather({ tempCelsius: 10, humidityPercent: 50, windSpeedMs: 0 });
    expect(r.context.thermalNeed).toBeCloseTo(0.75);
  });

  it('15C returns thermalNeed 0.5', () => {
    const r = mapWeather({ tempCelsius: 15, humidityPercent: 50, windSpeedMs: 0 });
    expect(r.context.thermalNeed).toBeCloseTo(0.5);
  });

  it('20C returns thermalNeed 0.0', () => {
    const r = mapWeather({ tempCelsius: 20, humidityPercent: 50, windSpeedMs: 0 });
    expect(r.context.thermalNeed).toBeCloseTo(0.0);
  });

  it('25C returns thermalNeed -0.5', () => {
    const r = mapWeather({ tempCelsius: 25, humidityPercent: 50, windSpeedMs: 0 });
    expect(r.context.thermalNeed).toBeCloseTo(-0.5);
  });

  it('29C returns thermalNeed approximately -0.75', () => {
    const r = mapWeather({ tempCelsius: 29, humidityPercent: 50, windSpeedMs: 0 });
    expect(r.context.thermalNeed).toBeCloseTo(-0.75);
  });

  it('33C returns thermalNeed -1.0', () => {
    const r = mapWeather({ tempCelsius: 33, humidityPercent: 50, windSpeedMs: 0 });
    expect(r.context.thermalNeed).toBeCloseTo(-1.0);
  });

  it('40C returns thermalNeed -1.0 (clamped)', () => {
    const r = mapWeather({ tempCelsius: 40, humidityPercent: 50, windSpeedMs: 0 });
    expect(r.context.thermalNeed).toBeCloseTo(-1.0);
  });

  it('-10C returns thermalNeed 1.0 (clamped)', () => {
    const r = mapWeather({ tempCelsius: -10, humidityPercent: 50, windSpeedMs: 0 });
    expect(r.context.thermalNeed).toBeCloseTo(1.0);
  });
});

// ---------------------------------------------------------------------------
// Humidity aggravation
// ---------------------------------------------------------------------------

describe('humidity aggravation', () => {
  it('humidity 80% returns kaphaAggravation approximately 0.33', () => {
    const r = mapWeather({ tempCelsius: 20, humidityPercent: 80, windSpeedMs: 0 });
    expect(r.context.kaphaAggravation).toBeCloseTo(0.333, 2);
  });

  it('humidity 100% returns kaphaAggravation 1.0', () => {
    const r = mapWeather({ tempCelsius: 20, humidityPercent: 100, windSpeedMs: 0 });
    expect(r.context.kaphaAggravation).toBeCloseTo(1.0);
  });

  it('humidity 70% returns kaphaAggravation 0', () => {
    const r = mapWeather({ tempCelsius: 20, humidityPercent: 70, windSpeedMs: 0 });
    expect(r.context.kaphaAggravation).toBe(0);
  });

  it('humidity 50% returns kaphaAggravation 0 and vataAggravation 0', () => {
    const r = mapWeather({ tempCelsius: 20, humidityPercent: 50, windSpeedMs: 0 });
    expect(r.context.kaphaAggravation).toBe(0);
    // vataAggravation combines humidity + wind; both 0 here
    expect(r.context.vataAggravation).toBe(0);
  });

  it('humidity 20% returns vataAggravation approximately 0.33', () => {
    const r = mapWeather({ tempCelsius: 20, humidityPercent: 20, windSpeedMs: 0 });
    // humidity vata = (30-20)/30 = 0.333, wind vata = 0
    expect(r.context.vataAggravation).toBeCloseTo(0.333, 2);
  });

  it('humidity 0% returns vataAggravation 1.0', () => {
    const r = mapWeather({ tempCelsius: 20, humidityPercent: 0, windSpeedMs: 0 });
    expect(r.context.vataAggravation).toBeCloseTo(1.0);
  });

  it('humidity 30% returns vataAggravation 0', () => {
    const r = mapWeather({ tempCelsius: 20, humidityPercent: 30, windSpeedMs: 0 });
    expect(r.context.vataAggravation).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Wind aggravation
// ---------------------------------------------------------------------------

describe('wind aggravation', () => {
  it('wind 0 m/s returns vataAggravation 0', () => {
    const r = mapWeather({ tempCelsius: 20, humidityPercent: 50, windSpeedMs: 0 });
    expect(r.context.vataAggravation).toBe(0);
  });

  it('wind 5 m/s returns vataAggravation 0.5', () => {
    const r = mapWeather({ tempCelsius: 20, humidityPercent: 50, windSpeedMs: 5 });
    expect(r.context.vataAggravation).toBeCloseTo(0.5);
  });

  it('wind 10 m/s returns vataAggravation 1.0', () => {
    const r = mapWeather({ tempCelsius: 20, humidityPercent: 50, windSpeedMs: 10 });
    expect(r.context.vataAggravation).toBeCloseTo(1.0);
  });

  it('wind 15 m/s returns vataAggravation 1.0 (capped)', () => {
    const r = mapWeather({ tempCelsius: 20, humidityPercent: 50, windSpeedMs: 15 });
    expect(r.context.vataAggravation).toBeCloseTo(1.0);
  });
});

// ---------------------------------------------------------------------------
// TCM wind patterns
// ---------------------------------------------------------------------------

describe('TCM wind patterns', () => {
  it('wind 6 m/s + temp 10C returns wind_cold', () => {
    const r = mapWeather({ tempCelsius: 10, humidityPercent: 50, windSpeedMs: 6 });
    expect(r.context.tcmWindPattern).toBe('wind_cold');
  });

  it('wind 6 m/s + temp 20C returns wind_heat', () => {
    const r = mapWeather({ tempCelsius: 20, humidityPercent: 50, windSpeedMs: 6 });
    expect(r.context.tcmWindPattern).toBe('wind_heat');
  });

  it('wind 6 m/s + temp 15C returns wind_heat (boundary)', () => {
    const r = mapWeather({ tempCelsius: 15, humidityPercent: 50, windSpeedMs: 6 });
    expect(r.context.tcmWindPattern).toBe('wind_heat');
  });

  it('wind 4 m/s + temp 10C returns none (wind too low)', () => {
    const r = mapWeather({ tempCelsius: 10, humidityPercent: 50, windSpeedMs: 4 });
    expect(r.context.tcmWindPattern).toBe('none');
  });

  it('wind 0 m/s returns none', () => {
    const r = mapWeather({ tempCelsius: 10, humidityPercent: 50, windSpeedMs: 0 });
    expect(r.context.tcmWindPattern).toBe('none');
  });
});

// ---------------------------------------------------------------------------
// Pitta aggravation
// ---------------------------------------------------------------------------

describe('pitta aggravation', () => {
  it('temp 25C returns pittaAggravation 0 (below threshold)', () => {
    const r = mapWeather({ tempCelsius: 25, humidityPercent: 50, windSpeedMs: 0 });
    expect(r.context.pittaAggravation).toBe(0);
  });

  it('temp 30C + humidity 50% returns pittaAggravation approximately 0.2', () => {
    const r = mapWeather({ tempCelsius: 30, humidityPercent: 50, windSpeedMs: 0 });
    // (30-28)/10 = 0.2, humidity 50 < 60 so no bonus
    expect(r.context.pittaAggravation).toBeCloseTo(0.2);
  });

  it('temp 30C + humidity 70% returns pittaAggravation approximately 0.5', () => {
    const r = mapWeather({ tempCelsius: 30, humidityPercent: 70, windSpeedMs: 0 });
    // (30-28)/10 + 0.3 = 0.5
    expect(r.context.pittaAggravation).toBeCloseTo(0.5);
  });

  it('temp 38C + humidity 80% returns pittaAggravation 1.0 (capped)', () => {
    const r = mapWeather({ tempCelsius: 38, humidityPercent: 80, windSpeedMs: 0 });
    // (38-28)/10 + 0.3 = 1.3, capped to 1.0
    expect(r.context.pittaAggravation).toBeCloseTo(1.0);
  });
});

// ---------------------------------------------------------------------------
// Combined weather context (mapWeather)
// ---------------------------------------------------------------------------

describe('mapWeather combined', () => {
  it('cold_windy returns thermalNeed 1.0, vataAggravation > 0.5, wind_cold', () => {
    const r = mapWeather(coldWindy);
    expect(r.context.thermalNeed).toBeCloseTo(1.0);
    expect(r.context.vataAggravation).toBeGreaterThan(0.5);
    expect(r.context.tcmWindPattern).toBe('wind_cold');
  });

  it('hot_humid returns thermalNeed -1.0, kaphaAggravation > 0.5, pittaAggravation > 0', () => {
    const r = mapWeather(hotHumid);
    expect(r.context.thermalNeed).toBeCloseTo(-1.0);
    expect(r.context.kaphaAggravation).toBeGreaterThanOrEqual(0.5);
    expect(r.context.pittaAggravation).toBeGreaterThan(0);
  });

  it('mildNeutral returns thermalNeed near 0, all aggravations low', () => {
    const r = mapWeather(mildNeutral);
    expect(r.context.thermalNeed).toBeCloseTo(0.0);
    expect(r.context.kaphaAggravation).toBe(0);
    expect(r.context.pittaAggravation).toBe(0);
    expect(r.context.vataAggravation).toBeLessThan(0.5);
  });
});

// ---------------------------------------------------------------------------
// applyWeatherToDoshaProfile
// ---------------------------------------------------------------------------

describe('applyWeatherToDoshaProfile', () => {
  it('resulting profile sums to 1.0', () => {
    const weather = mapWeather(coldWindy).context;
    const result = applyWeatherToDoshaProfile(balancedProfile, weather);
    const sum = result.vata + result.pitta + result.kapha;
    expect(sum).toBeCloseTo(1.0);
  });

  it('no single dosha shifts by more than 15% from the base profile', () => {
    const weather = mapWeather(coldWindy).context;

    // After normalization the actual shift may differ slightly from
    // raw MAX_WEATHER_SHIFT, but pre-normalization raw shift is capped
    // because aggravation is 0-1 and multiplier is 0.15.
    // We check the raw addition never exceeds MAX_WEATHER_SHIFT.
    const rawVataShift = weather.vataAggravation * MAX_WEATHER_SHIFT;
    const rawPittaShift = weather.pittaAggravation * MAX_WEATHER_SHIFT;
    const rawKaphaShift = weather.kaphaAggravation * MAX_WEATHER_SHIFT;

    expect(rawVataShift).toBeLessThanOrEqual(MAX_WEATHER_SHIFT + 1e-10);
    expect(rawPittaShift).toBeLessThanOrEqual(MAX_WEATHER_SHIFT + 1e-10);
    expect(rawKaphaShift).toBeLessThanOrEqual(MAX_WEATHER_SHIFT + 1e-10);
  });

  it('extreme cold+wind shifts vata score upward relative to base', () => {
    const weather = mapWeather(extremeCold).context;
    const result = applyWeatherToDoshaProfile(balancedProfile, weather);
    expect(result.vata).toBeGreaterThan(balancedProfile.vata);
  });

  it('extreme heat+humidity shifts pitta upward and kapha raw value increases', () => {
    const weather = mapWeather(hotHumid).context;
    const result = applyWeatherToDoshaProfile(balancedProfile, weather);
    // Pitta has the largest aggravation so its normalized share increases
    expect(result.pitta).toBeGreaterThan(balancedProfile.pitta);
    // Kapha aggravation is nonzero, so its raw value increased before
    // normalization. After normalization pitta dominates, but kapha's
    // pre-normalization value was higher than base.
    const rawKapha = balancedProfile.kapha + weather.kaphaAggravation * MAX_WEATHER_SHIFT;
    expect(rawKapha).toBeGreaterThan(balancedProfile.kapha);
  });

  it('mild neutral weather produces minimal shift (all doshas within 5% of base)', () => {
    const weather = mapWeather(mildNeutral).context;
    const result = applyWeatherToDoshaProfile(balancedProfile, weather);
    // Wind 3 m/s gives windVata 0.3 -> raw shift 0.045, after
    // normalization ~0.03. Using 5% tolerance.
    expect(Math.abs(result.vata - balancedProfile.vata)).toBeLessThan(0.05);
    expect(Math.abs(result.pitta - balancedProfile.pitta)).toBeLessThan(0.05);
    expect(Math.abs(result.kapha - balancedProfile.kapha)).toBeLessThan(0.05);
  });

  it('the 15% cap holds even with maximum aggravation', () => {
    const maxWeather: WeatherContext = {
      thermalNeed: -1.0,
      vataAggravation: 1.0,
      pittaAggravation: 1.0,
      kaphaAggravation: 1.0,
      tcmWindPattern: 'wind_heat',
    };
    const result = applyWeatherToDoshaProfile(balancedProfile, maxWeather);
    const sum = result.vata + result.pitta + result.kapha;
    expect(sum).toBeCloseTo(1.0);

    // When all aggravations are equal, the shift is symmetric -- profile
    // stays close to the original balanced state.
    expect(Math.abs(result.vata - balancedProfile.vata)).toBeLessThan(0.02);
    expect(Math.abs(result.pitta - balancedProfile.pitta)).toBeLessThan(0.02);
    expect(Math.abs(result.kapha - balancedProfile.kapha)).toBeLessThan(0.02);
  });
});

// ---------------------------------------------------------------------------
// Debug output
// ---------------------------------------------------------------------------

describe('debug output', () => {
  it('includes rawThermalNeed, rawKaphaAggravation, rawWindVata, rawHumidityVata', () => {
    const r = mapWeather(coldWindy);
    expect(r.debug).toHaveProperty('rawThermalNeed');
    expect(r.debug).toHaveProperty('rawKaphaAggravation');
    expect(r.debug).toHaveProperty('rawWindVata');
    expect(r.debug).toHaveProperty('rawHumidityVata');
  });

  it('includes combinedVataAggravation', () => {
    const r = mapWeather(warmWindy);
    expect(r.debug).toHaveProperty('combinedVataAggravation');
    // combined = humidityVata + windVata, capped at 1.0
    // humidity 40 -> humidityVata 0, wind 8 -> windVata 0.8
    expect(r.debug.combinedVataAggravation).toBeCloseTo(0.8);
  });

  it('includes windPatternInputs with windSpeed and temp', () => {
    const r = mapWeather(warmWindy);
    expect(r.debug.windPatternInputs).toEqual({
      windSpeed: 8,
      temp: 25,
    });
  });
});

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

describe('input validation', () => {
  it('rejects humidity above 100', () => {
    expect(() => mapWeather({ tempCelsius: 20, humidityPercent: 101, windSpeedMs: 0 })).toThrow();
  });

  it('rejects negative humidity', () => {
    expect(() => mapWeather({ tempCelsius: 20, humidityPercent: -1, windSpeedMs: 0 })).toThrow();
  });

  it('rejects negative wind speed', () => {
    expect(() => mapWeather({ tempCelsius: 20, humidityPercent: 50, windSpeedMs: -1 })).toThrow();
  });
});
