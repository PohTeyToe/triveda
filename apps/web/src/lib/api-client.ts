/**
 * Singleton typed API client instance.
 *
 * The frontend uses this to make type-safe calls to the Triveda API.
 * The actual base URL comes from the environment.
 */

import { type Client, createClient } from '@triveda/api-client';

let _client: Client | null = null;

function getBaseUrl(): string {
  return import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
}

/** Public accessor for code that needs the raw base URL (e.g., SSE). */
export function getApiBaseUrl(): string {
  return getBaseUrl();
}

export function getApiClient(): Client {
  if (!_client) {
    _client = createClient(getBaseUrl());
  }
  return _client;
}

/**
 * Plain fetch helper for React Query hooks where the typed client
 * adds unnecessary complexity. Returns parsed JSON.
 */
export function apiUrl(path: string): string {
  return `${getBaseUrl()}/api/v1${path}`;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}
