import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { auth } from './middleware/auth.js';
import { createCorsMiddleware } from './middleware/cors.js';
import { errorHandler } from './middleware/error.js';
import { rateLimit } from './middleware/rate-limit.js';
import { requestId } from './middleware/request-id.js';
import { health } from './routes/health.js';

/**
 * Create and configure the Hono application with full middleware chain.
 *
 * Middleware order:
 * 1. Request ID — generate UUID, attach to context and response header
 * 2. CORS — configured for Vercel previews, localhost, production domain
 * 3. Request logger — log method, path, status, duration
 * 4. Error handler — catch-all for unhandled errors
 * 5. Rate limiter — in-memory, 100 req/min per user or IP
 * 6. Auth — Supabase JWT via JWKS (skipped for public routes)
 */
export function createApp() {
  const app = new Hono();

  // 1. Request ID
  app.use('*', requestId);

  // 2. CORS
  app.use('*', createCorsMiddleware());

  // 3. Request logger
  app.use('*', logger());

  // 4. Error handler
  app.onError(errorHandler);

  // 5. Rate limiter
  app.use('*', rateLimit);

  // --- Public routes (no auth) ---
  app.route('/healthz', health);

  // 6. Auth middleware for all other routes
  app.use('/api/*', auth);

  // --- Protected routes mount here in future sections ---
  // app.route('/api/v1/...', someRoutes);

  return app;
}

export const app = createApp();
