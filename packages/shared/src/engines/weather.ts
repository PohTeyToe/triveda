/**
 * WeatherMapper interface.
 *
 * Translates external weather data into Ayurvedic qualities (gunas).
 * Implemented in split 02.
 */

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
