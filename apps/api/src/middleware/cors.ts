import { cors } from 'hono/cors';
import { getApiEnv } from '../env.js';

/**
 * CORS middleware allowing:
 * - *.vercel.app (preview deploys)
 * - localhost on any port (local development)
 * - Production domain (via CORS_ORIGIN env var)
 */
export function createCorsMiddleware() {
  return cors({
    origin: (origin) => {
      if (!origin) return '';

      // Allow all Vercel preview deploys
      if (/^https:\/\/[\w-]+\.vercel\.app$/.test(origin)) {
        return origin;
      }

      // Allow localhost on any port
      if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) {
        return origin;
      }

      // Allow configured production origin
      const env = getApiEnv();
      if (env.CORS_ORIGIN && origin === env.CORS_ORIGIN) {
        return origin;
      }

      // Reject unknown origins
      return '';
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Authorization', 'Content-Type'],
    exposeHeaders: ['X-Request-Id'],
    maxAge: 86400,
  });
}
