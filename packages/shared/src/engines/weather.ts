/**
 * Weather-to-Constitution Mapper.
 *
 * Converts numeric weather data (temperature, humidity, wind speed) into
 * Ayurvedic dosha aggravation levels and TCM wind patterns. Also provides
 * applyWeatherToDoshaProfile which shifts the effective dosha profile by
 * up to 15% based on weather conditions.
 *
 * Pure functions -- no IO or side effects.
 */

import {
  type DoshaProfile,
  type WeatherContext,
  type WeatherDebug,
  type WeatherInput,
  WeatherInputSchema,
  type WeatherResult,
} from './types.js';
import { linearInterpolate, normalize } from './utils/math-helpers.js';

// ---------------------------------------------------------------------------
// Legacy interface stubs (retained for compatibility with split 01 imports)
// ---------------------------------------------------------------------------

export interface WeatherData {
  temperatureCelsius: number;
  humidity: number;
  windSpeedKmh: number;
  condition: string;
}

export interface AyurvedicQualities {
  hot: number;
  cold: number;
  dry: number;
  moist: number;
  light: number;
  heavy: number;
}

export interface WeatherMapper {
  /** Map weather data to Ayurvedic quality scores. */
  mapToQualities(weather: WeatherData): AyurvedicQualities;
}

// ---------------------------------------------------------------------------
// Tunable threshold constants
// ---------------------------------------------------------------------------

/** Temperature breakpoints (Celsius) */
export const TEMP_STRONG_COLD = 5;
export const TEMP_MILD_COLD = 15;
export const TEMP_MILD_WARM = 25;
export const TEMP_STRONG_HOT = 33;

/** Humidity thresholds (percent) */
export const HUMIDITY_KAPHA_THRESHOLD = 70;
export const HUMIDITY_VATA_THRESHOLD = 30;

/** Wind thresholds */
export const WIND_VATA_MAX = 10; // m/s at which vataAggravation caps at 1.0
export const WIND_PATTERN_THRESHOLD = 5; // m/s above which TCM wind patterns activate
export const WIND_COLD_TEMP_THRESHOLD = 15; // below this + wind = wind_cold

/** Pitta thresholds */
export const PITTA_TEMP_THRESHOLD = 28;
export const PITTA_HUMIDITY_BONUS_THRESHOLD = 60;
export const PITTA_HUMIDITY_BONUS = 0.3;

/** Profile shift cap */
export const MAX_WEATHER_SHIFT = 0.15;

// ---------------------------------------------------------------------------
// mapWeather
// ---------------------------------------------------------------------------

/**
 * Map weather input to a WeatherContext with dosha aggravation levels
 * and TCM wind pattern detection.
 *
 * Continuous piecewise linear temperature mapping with no discontinuities.
 */
export function mapWeather(input: WeatherInput): WeatherResult {
  // Validate input
  const parsed = WeatherInputSchema.parse(input);
  const { tempCelsius, humidityPercent, windSpeedMs } = parsed;

  // 1. Thermal need -- continuous piecewise linear
  let rawThermalNeed: number;
  if (tempCelsius <= TEMP_STRONG_COLD) {
    rawThermalNeed = 1.0;
  } else if (tempCelsius <= TEMP_MILD_COLD) {
    rawThermalNeed = linearInterpolate(tempCelsius, TEMP_STRONG_COLD, TEMP_MILD_COLD, 1.0, 0.5);
  } else if (tempCelsius <= TEMP_MILD_WARM) {
    rawThermalNeed = linearInterpolate(tempCelsius, TEMP_MILD_COLD, TEMP_MILD_WARM, 0.5, -0.5);
  } else if (tempCelsius <= TEMP_STRONG_HOT) {
    rawThermalNeed = linearInterpolate(tempCelsius, TEMP_MILD_WARM, TEMP_STRONG_HOT, -0.5, -1.0);
  } else {
    rawThermalNeed = -1.0;
  }

  // 2. Humidity aggravation
  const rawKaphaAggravation =
    humidityPercent > HUMIDITY_KAPHA_THRESHOLD
      ? Math.min(1.0, (humidityPercent - HUMIDITY_KAPHA_THRESHOLD) / 30)
      : 0;

  const rawHumidityVata =
    humidityPercent < HUMIDITY_VATA_THRESHOLD
      ? Math.min(1.0, (HUMIDITY_VATA_THRESHOLD - humidityPercent) / 30)
      : 0;

  // 3. Wind aggravation
  const rawWindVata = Math.min(1.0, windSpeedMs / WIND_VATA_MAX);

  const tcmWindPattern: WeatherContext['tcmWindPattern'] =
    windSpeedMs > WIND_PATTERN_THRESHOLD
      ? tempCelsius < WIND_COLD_TEMP_THRESHOLD
        ? 'wind_cold'
        : 'wind_heat'
      : 'none';

  // 4. Pitta aggravation
  let rawPittaAggravation: number;
  if (tempCelsius > PITTA_TEMP_THRESHOLD) {
    const tempComponent = (tempCelsius - PITTA_TEMP_THRESHOLD) / 10;
    const humidityBonus =
      humidityPercent > PITTA_HUMIDITY_BONUS_THRESHOLD ? PITTA_HUMIDITY_BONUS : 0;
    rawPittaAggravation = Math.min(1.0, tempComponent + humidityBonus);
  } else {
    rawPittaAggravation = 0;
  }

  // 5. Combined vata
  const combinedVataAggravation = Math.min(1.0, rawHumidityVata + rawWindVata);

  // 6. Build result
  const context: WeatherContext = {
    thermalNeed: rawThermalNeed,
    kaphaAggravation: rawKaphaAggravation,
    vataAggravation: combinedVataAggravation,
    pittaAggravation: rawPittaAggravation,
    tcmWindPattern,
  };

  const debug: WeatherDebug = {
    rawThermalNeed,
    rawKaphaAggravation,
    rawHumidityVata,
    rawWindVata,
    rawPittaAggravation,
    combinedVataAggravation,
    windPatternInputs: {
      windSpeed: windSpeedMs,
      temp: tempCelsius,
    },
  };

  return { context, debug };
}

// ---------------------------------------------------------------------------
// applyWeatherToDoshaProfile
// ---------------------------------------------------------------------------

/**
 * Shift a dosha profile based on weather conditions.
 *
 * Each dosha is adjusted by its aggravation level multiplied by
 * MAX_WEATHER_SHIFT (0.15), then the profile is re-normalized to sum to 1.0.
 */
export function applyWeatherToDoshaProfile(
  profile: DoshaProfile,
  weather: WeatherContext,
): DoshaProfile {
  const adjustedVata = profile.vata + weather.vataAggravation * MAX_WEATHER_SHIFT;
  const adjustedPitta = profile.pitta + weather.pittaAggravation * MAX_WEATHER_SHIFT;
  const adjustedKapha = profile.kapha + weather.kaphaAggravation * MAX_WEATHER_SHIFT;

  const normalized = normalize({
    vata: adjustedVata,
    pitta: adjustedPitta,
    kapha: adjustedKapha,
  });

  return {
    vata: normalized.vata ?? 0,
    pitta: normalized.pitta ?? 0,
    kapha: normalized.kapha ?? 0,
  };
}
