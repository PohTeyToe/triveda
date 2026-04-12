/**
 * Weather route -- GET /weather
 *
 * Returns current weather data for the given coordinates.
 * Uses the WeatherCache to avoid redundant OpenWeather API calls.
 * Works with and without authentication (allow_anon).
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { getApiEnv } from '../env.js';
import { weatherCache } from '../lib/weather-cache.js';
import type { WeatherData } from '../lib/weather-cache.js';
import { AppError } from '../middleware/error.js';

const WeatherQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

const weather = new Hono();

/**
 * Fetch weather from OpenWeather API and transform to internal shape.
 */
async function fetchFromOpenWeather(lat: number, lon: number): Promise<WeatherData> {
  const env = getApiEnv();
  const apiKey = env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    // Demo mode fallback: return synthetic weather data
    return {
      temperature: 22,
      humidity: 55,
      windSpeed: 3.5,
      description: 'clear sky',
      icon: '01d',
    };
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`OpenWeather API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  return {
    temperature: data.main?.temp ?? 0,
    humidity: data.main?.humidity ?? 0,
    windSpeed: data.wind?.speed ?? 0,
    description: data.weather?.[0]?.description ?? 'unknown',
    icon: data.weather?.[0]?.icon ?? '',
  };
}

/**
 * GET / -- get weather data for coordinates.
 * Query params: lat (number, -90..90), lon (number, -180..180)
 */
weather.get('/', async (c) => {
  const raw = {
    lat: c.req.query('lat'),
    lon: c.req.query('lon'),
  };

  const parsed = WeatherQuerySchema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const field = firstIssue?.path[0] ?? 'query';
    const message = firstIssue?.message ?? 'Invalid query parameters';
    throw new AppError(400, 'VALIDATION_ERROR', `Invalid ${field}: ${message}`);
  }

  const { lat, lon } = parsed.data;

  const data = await weatherCache.get(lat, lon, () => fetchFromOpenWeather(lat, lon));

  return c.json(data);
});

export { weather };
