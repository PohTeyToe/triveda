/**
 * Typed RPC client for the Triveda API.
 *
 * The frontend imports from this package (never directly from apps/api).
 * The type-only import of AppType means no runtime code from apps/api
 * is bundled into the frontend -- only type information flows through.
 */

import type { Hono } from 'hono';
import { hc } from 'hono/client';

// Full AppType requires apps/api composite build.
// Using base Hono type for now -- route-specific typing restored
// once the api package exports a compiled .d.ts.
// biome-ignore lint/suspicious/noExplicitAny: deferred until api is composite
export type AppType = Hono<any, any, any>;

/** Pre-compiled client type for IDE performance. */
export type Client = ReturnType<typeof hc<AppType>>;

/** Create a typed Hono RPC client for the Triveda API. */
export function createClient(baseUrl: string): Client {
  return hc<AppType>(baseUrl);
}
