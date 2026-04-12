import { createMiddleware } from 'hono/factory';

/**
 * Request ID middleware.
 * Preserves a client-provided X-Request-Id if present,
 * otherwise generates a UUID v4. Attaches to context and response header.
 */
export const requestId = createMiddleware(async (c, next) => {
  const existing = c.req.header('X-Request-Id');
  const id = existing || crypto.randomUUID();
  c.set('requestId', id);
  c.header('X-Request-Id', id);
  await next();
});
