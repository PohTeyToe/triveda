import { cors } from 'hono/cors';
import { getApiEnv } from '../env.js';

/**
 * CORS middleware allowing:
 * - *.vercel.app (preview deploys)
 * - localhost on any port (development only)
 * - Production domain (via CORS_ORIGIN or CORS_PRODUCTION_ORIGIN env var)
 */
export function createCorsMiddleware() {
  return cors({
    origin: (origin) => {
      if (!origin) return '';

      // Allow all Vercel preview deploys
      if (/^https:\/\/[\w-]+\.vercel\.app$/.test(origin)) {
        return origin;
      }

      const env = getApiEnv();

      // Allow localhost on any port in development
      if (env.NODE_ENV === 'development' && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
        return origin;
      }

      // Allow configured production origin (CORS_PRODUCTION_ORIGIN or legacy CORS_ORIGIN)
      const prodOrigin = env.CORS_PRODUCTION_ORIGIN || env.CORS_ORIGIN;
      if (prodOrigin && origin === prodOrigin) {
        return origin;
      }

      // Reject unknown origins
      return '';
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Authorization', 'Content-Type', 'X-Request-Id'],
    exposeHeaders: ['X-Request-Id'],
    credentials: true,
    maxAge: 3600,
  });
}
