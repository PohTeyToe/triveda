import { OpenAPIHono } from '@hono/zod-openapi';
import { logger } from 'hono/logger';
import { auth } from './middleware/auth.js';
import { createCorsMiddleware } from './middleware/cors.js';
import { errorHandler } from './middleware/error.js';
import { rateLimit } from './middleware/rate-limit.js';
import { requestId } from './middleware/request-id.js';
import { telemetry } from './middleware/telemetry.js';
import { browse } from './routes/browse.js';
import { checkIn } from './routes/check-in.js';
import { constitution } from './routes/constitution.js';
import { dailyFood } from './routes/daily-food.js';
import { faceScan } from './routes/face-scan.js';
import { feedbackRoute } from './routes/food-feedback.js';
import { health } from './routes/health.js';
import { profile } from './routes/profile.js';
import { seasonal } from './routes/seasonal.js';
import { weather } from './routes/weather.js';

/**
 * Create and configure the OpenAPIHono application with full middleware chain.
 *
 * Uses OpenAPIHono (from @hono/zod-openapi) instead of plain Hono so that
 * route definitions can use Zod schemas for request/response validation
 * and automatic OpenAPI spec generation.
 *
 * Middleware order:
 * 1. Request ID -- generate or preserve UUID, attach to context and response header
 * 2. CORS -- configured for Vercel previews, localhost (dev only), production domain
 * 3. Request logger -- log method, path, status, duration
 * 4. Error handler -- catch-all for unhandled errors
 * 5. Rate limiter -- in-memory default, 100 req/min per user or IP
 * 6. Auth -- Supabase JWT via JWKS (skipped for public routes)
 * 7. Telemetry -- fire-and-forget request logging (after handlers)
 */
export function createApp() {
  const app = new OpenAPIHono();

  // 1. Request ID
  app.use('*', requestId);

  // 2. CORS
  app.use('*', createCorsMiddleware());

  // 3. Request logger
  app.use('*', logger());

  // 4. Error handler
  app.onError(errorHandler);

  // 5. Default rate limiter
  app.use('*', rateLimit);

  // 7. Telemetry (wraps next() to measure full handler time)
  app.use('*', telemetry);

  // --- Public routes (no auth) ---
  app.route('/healthz', health);
  app.route('/weather', weather);

  // 6. Auth middleware for all other routes
  app.use('/api/*', auth);

  // --- Protected routes ---
  app.route('/api/v1/constitution', constitution);
  app.route('/api/v1/daily-food', dailyFood);
  app.route('/api/v1/food-feedback', feedbackRoute);
  app.route('/api/v1', browse);
  app.route('/api/v1/daily-check-in', checkIn);
  app.route('/api/v1/profile', profile);
  app.route('/api/v1/face-scan', faceScan);
  app.route('/api/v1/seasonal-transition', seasonal);

  // --- OpenAPI documentation (non-production only) ---
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    app.doc('/doc', {
      openapi: '3.0.0',
      info: {
        title: 'Triveda API',
        version: '0.1.0',
        description: 'Three-tradition daily food companion API',
      },
    });

    app.get('/docs', (c) => {
      const html = `<!DOCTYPE html>
<html>
<head>
  <title>Triveda API Docs</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>
  <script id="api-reference" data-url="/doc"></script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`;
      return c.html(html);
    });
  }

  return app;
}

export const app = createApp();
