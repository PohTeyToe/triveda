import type { app } from './app.js';

/**
 * AppType -- the Hono route type for this backend.
 *
 * This is the ONLY export consumed by the frontend's typed RPC client.
 * apps/web imports this type (via @triveda/api/types) to create a
 * fully typed hc() client. Only the type is exported, never the app instance.
 */
export type AppType = typeof app;

/**
 * UserContext extracted from JWT claims by the auth middleware.
 * Available via c.get('user') on authenticated routes.
 */
export type UserContext = {
  id: string; // JWT sub claim (Supabase user UUID)
  email: string; // JWT email claim
  role: string; // JWT role claim (authenticated, anon, service_role)
};

/**
 * Standard error response envelope returned by the error handler.
 */
export type ErrorResponse = {
  error: string;
  code: string;
  requestId: string;
};
