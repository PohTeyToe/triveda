import { rateLimiter } from 'hono-rate-limiter';
import type { AuthUser } from './auth.js';

/**
 * In-memory rate limiter stub.
 * Default: 100 requests per minute, keyed by user ID or IP.
 *
 * This is a stub for the middleware chain. Split 06 configures
 * real per-endpoint limits.
 */
export const rateLimit = rateLimiter({
  windowMs: 60_000, // 1 minute
  limit: 100,
  keyGenerator: (c): string => {
    // Prefer user ID (set by auth middleware) over IP
    // Use var() to avoid typed context requirement -- rate limiter
    // runs before auth on public routes where user may not be set.
    const user = c.var?.['user' as never] as AuthUser | undefined;
    if (user?.id) return user.id;

    // Fall back to IP for unauthenticated routes
    return (
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
      c.req.header('x-real-ip') ??
      'anonymous'
    );
  },
});
