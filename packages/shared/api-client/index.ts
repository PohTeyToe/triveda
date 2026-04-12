/**
 * Typed RPC client for the Triveda API.
 *
 * The frontend imports from this package (never directly from apps/api).
 * The type-only import of AppType means no runtime code from apps/api
 * is bundled into the frontend -- only type information flows through.
 */

import { hc } from 'hono/client';
import type { AppType } from '../../apps/api/src/app.js';

export type { AppType };

/** Pre-compiled client type for IDE performance. */
export type Client = ReturnType<typeof hc<AppType>>;

/** Create a typed Hono RPC client for the Triveda API. */
export function createClient(baseUrl: string): Client {
  return hc<AppType>(baseUrl);
}
