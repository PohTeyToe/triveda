import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { WeatherCache, type WeatherData } from '../../src/lib/weather-cache.js';

const MOCK_WEATHER: WeatherData = {
  temperature: 22,
  humidity: 55,
  windSpeed: 3.5,
  description: 'clear sky',
  icon: '01d',
};

const MOCK_WEATHER_2: WeatherData = {
  temperature: 18,
  humidity: 70,
  windSpeed: 5.0,
  description: 'light rain',
  icon: '10d',
};

describe('WeatherCache', () => {
  let cache: WeatherCache;

  beforeEach(() => {
    // Short TTL and no sweep for testing
    cache = new WeatherCache({ ttlMs: 100, sweepIntervalMs: 60_000 });
  });

  afterEach(() => {
    cache.clear();
  });

  it('cache miss triggers fetch, stores result, returns data', async () => {
    const fetchFn = mock(() => Promise.resolve(MOCK_WEATHER));

    const result = await cache.get(40.71, -74.01, fetchFn);

    expect(result).toEqual(MOCK_WEATHER);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(cache.size).toBe(1);
  });

  it('cache hit returns stored data without fetching again', async () => {
    const fetchFn = mock(() => Promise.resolve(MOCK_WEATHER));

    await cache.get(40.71, -74.01, fetchFn);
    const result = await cache.get(40.71, -74.01, fetchFn);

    expect(result).toEqual(MOCK_WEATHER);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('expired entry triggers new fetch', async () => {
    const fetchFn = mock()
      .mockResolvedValueOnce(MOCK_WEATHER)
      .mockResolvedValueOnce(MOCK_WEATHER_2);

    await cache.get(40.71, -74.01, fetchFn);
    expect(fetchFn).toHaveBeenCalledTimes(1);

    // Wait for TTL to expire
    await new Promise((r) => setTimeout(r, 150));

    const result = await cache.get(40.71, -74.01, fetchFn);
    expect(result).toEqual(MOCK_WEATHER_2);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('coordinate rounding: nearby coords produce same cache key', async () => {
    const fetchFn = mock(() => Promise.resolve(MOCK_WEATHER));

    // (40.7128, -74.0060) and (40.7130, -74.0058) round to (40.71, -74.01)
    await cache.get(40.7128, -74.006, fetchFn);
    await cache.get(40.713, -74.0058, fetchFn);

    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('coordinate rounding: different rounded coords produce different keys', async () => {
    const fetchFn = mock(() => Promise.resolve(MOCK_WEATHER));

    // (40.71, -74.01) vs (40.72, -74.01) -- different after rounding
    await cache.get(40.71, -74.01, fetchFn);
    await cache.get(40.72, -74.01, fetchFn);

    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('clear() empties all entries', async () => {
    const fetchFn = mock(() => Promise.resolve(MOCK_WEATHER));

    await cache.get(40.71, -74.01, fetchFn);
    expect(cache.size).toBe(1);

    cache.clear();
    expect(cache.size).toBe(0);
  });

  it('API error with no cache throws error', async () => {
    const fetchFn = mock(() => Promise.reject(new Error('API down')));

    await expect(cache.get(40.71, -74.01, fetchFn)).rejects.toThrow('API down');
  });

  it('API error with existing stale cache returns stale data', async () => {
    const fetchFn = mock()
      .mockResolvedValueOnce(MOCK_WEATHER)
      .mockRejectedValueOnce(new Error('API down'));

    // Populate cache
    await cache.get(40.71, -74.01, fetchFn);

    // Wait for TTL to expire
    await new Promise((r) => setTimeout(r, 150));

    // Should return stale data instead of throwing
    const result = await cache.get(40.71, -74.01, fetchFn);
    expect(result).toEqual(MOCK_WEATHER);
  });

  it('concurrent requests for same coordinates produce one fetch call', async () => {
    let resolvePromise: (val: WeatherData) => void;
    const slowFetch = new Promise<WeatherData>((resolve) => {
      resolvePromise = resolve;
    });

    const fetchFn = mock(() => slowFetch);

    // Fire two concurrent requests
    const p1 = cache.get(40.71, -74.01, fetchFn);
    const p2 = cache.get(40.71, -74.01, fetchFn);

    // Resolve the single fetch
    resolvePromise?.(MOCK_WEATHER);

    const [r1, r2] = await Promise.all([p1, p2]);

    expect(r1).toEqual(MOCK_WEATHER);
    expect(r2).toEqual(MOCK_WEATHER);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});
