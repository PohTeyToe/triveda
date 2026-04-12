import { rateLimiter } from 'hono-rate-limiter';
import type { AuthUser } from './auth.js';

/**
 * Key generator shared across all rate limiters.
 * Uses authenticated user ID when available, falls back to IP.
 */
function keyGenerator(c: {
  var?: Record<string, unknown>;
  req: { header: (name: string) => string | undefined };
}): string {
  const user = c.var?.['user' as never] as AuthUser | undefined;
  if (user?.id) return user.id;
  return (
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    c.req.header('x-real-ip') ??
    'anonymous'
  );
}

/**
 * Per-route rate limit configurations.
 * Each entry maps a route group name to its requests-per-minute limit.
 */
export const RATE_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  'daily-food': { limit: 30, windowMs: 60_000 },
  'constitution-assess': { limit: 10, windowMs: 60_000 },
  'constitution-answer': { limit: 30, windowMs: 60_000 },
  'food-feedback': { limit: 60, windowMs: 60_000 },
  'foods-browse': { limit: 60, windowMs: 60_000 },
  'herbs-browse': { limit: 60, windowMs: 60_000 },
  'blood-work-upload': { limit: 5, windowMs: 60_000 },
  'foods-llm-extend': { limit: 10, windowMs: 60_000 },
  weather: { limit: 60, windowMs: 60_000 },
  'demo-state': { limit: 30, windowMs: 60_000 },
  'daily-check-in': { limit: 30, windowMs: 60_000 },
  'weekly-herb': { limit: 60, windowMs: 60_000 },
  'triggered-recs': { limit: 60, windowMs: 60_000 },
  profile: { limit: 30, windowMs: 60_000 },
  geocode: { limit: 30, windowMs: 60_000 },
  'face-scan': { limit: 10, windowMs: 60_000 },
  default: { limit: 60, windowMs: 60_000 },
};

/**
 * Create a rate limiter for a specific route group.
 * Each call returns a fresh middleware with its own in-memory store,
 * so different route groups have independent counters.
 */
export function createRateLimiter(group: keyof typeof RATE_LIMITS) {
  const config = RATE_LIMITS[group] ?? RATE_LIMITS.default;
  return rateLimiter({
    windowMs: config.windowMs,
    limit: config.limit,
    keyGenerator,
  });
}

/**
 * Default rate limiter for the global middleware chain.
 * 100 requests per minute, keyed by user ID or IP.
 * Individual route groups override this with createRateLimiter().
 */
export const rateLimit = rateLimiter({
  windowMs: 60_000,
  limit: 100,
  keyGenerator,
});
