/**
 * In-memory TTL cache for OpenWeather API responses.
 *
 * - Rounds coordinates to 2 decimal places (~1.1 km precision at equator)
 * - 30-minute TTL with lazy eviction on read + periodic sweep
 * - Thundering herd prevention via stored fetch promises
 * - Stale cache fallback on API errors
 */

export type WeatherData = {
  temperature: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
};

type CacheEntry = {
  data: WeatherData;
  expiry: number;
  fetchPromise?: Promise<WeatherData>;
};

const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes
const DEFAULT_SWEEP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

function makeKey(lat: number, lon: number): string {
  const rlat = Math.round(lat * 100) / 100;
  const rlon = Math.round(lon * 100) / 100;
  return `${rlat}:${rlon}`;
}

export class WeatherCache {
  private entries = new Map<string, CacheEntry>();
  private sweepTimer: ReturnType<typeof setInterval> | null = null;
  private readonly ttlMs: number;

  constructor(options?: { ttlMs?: number; sweepIntervalMs?: number }) {
    this.ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
    const sweepMs = options?.sweepIntervalMs ?? DEFAULT_SWEEP_INTERVAL_MS;

    this.sweepTimer = setInterval(() => this.sweep(), sweepMs);
    // Allow the process to exit even if the sweep timer is still running
    if (this.sweepTimer && typeof this.sweepTimer === 'object' && 'unref' in this.sweepTimer) {
      this.sweepTimer.unref();
    }
  }

  /**
   * Get weather data for coordinates.
   * On cache miss, calls fetchFn to retrieve data.
   * On API error with existing stale data, returns stale data.
   */
  async get(lat: number, lon: number, fetchFn: () => Promise<WeatherData>): Promise<WeatherData> {
    const key = makeKey(lat, lon);
    const now = Date.now();
    const existing = this.entries.get(key);

    // Cache hit (not expired)
    if (existing && now < existing.expiry) {
      return existing.data;
    }

    // Concurrent request dedup: if a fetch is already in flight, await it
    if (existing?.fetchPromise) {
      return existing.fetchPromise;
    }

    // Cache miss or expired -- start fetch
    const promise = this.doFetch(key, fetchFn, existing);

    // Store the promise in the entry for thundering herd prevention
    if (existing) {
      existing.fetchPromise = promise;
    } else {
      this.entries.set(key, {
        data: undefined as unknown as WeatherData,
        expiry: 0,
        fetchPromise: promise,
      });
    }

    return promise;
  }

  private async doFetch(
    key: string,
    fetchFn: () => Promise<WeatherData>,
    staleEntry: CacheEntry | undefined,
  ): Promise<WeatherData> {
    try {
      const data = await fetchFn();
      this.entries.set(key, {
        data,
        expiry: Date.now() + this.ttlMs,
      });
      return data;
    } catch (err) {
      // Clear the fetch promise so future requests can retry
      const current = this.entries.get(key);
      if (current) {
        current.fetchPromise = undefined;
      }

      // Stale fallback: if we have old data, return it
      if (staleEntry?.data) {
        console.error('OpenWeather API error, returning stale cache:', (err as Error).message);
        return staleEntry.data;
      }

      throw err;
    }
  }

  /** Remove all expired entries. */
  private sweep(): void {
    const now = Date.now();
    for (const [key, entry] of this.entries) {
      if (now >= entry.expiry && !entry.fetchPromise) {
        this.entries.delete(key);
      }
    }
  }

  /** Clear all entries and stop the sweep interval. */
  clear(): void {
    this.entries.clear();
    if (this.sweepTimer !== null) {
      clearInterval(this.sweepTimer);
      this.sweepTimer = null;
    }
  }

  /** Number of entries (for testing). */
  get size(): number {
    return this.entries.size;
  }
}

/** Module-level singleton used by the weather route and daily-food handler. */
export const weatherCache = new WeatherCache();
