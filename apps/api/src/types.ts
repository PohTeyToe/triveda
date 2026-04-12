import type { app } from './app.js';

/**
 * AppType — the Hono route type for this backend.
 *
 * This is the ONLY export consumed by the frontend's typed RPC client.
 * apps/web imports this type (via @triveda/api/types) to create a
 * fully typed hc() client. Only the type is exported, never the app instance.
 */
export type AppType = typeof app;
