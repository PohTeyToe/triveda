import { createMiddleware } from 'hono/factory';

/**
 * Generates a UUID v4 request ID for every request.
 * Attaches it to the Hono context and the X-Request-Id response header.
 */
export const requestId = createMiddleware(async (c, next) => {
  const id = crypto.randomUUID();
  c.set('requestId', id);
  c.header('X-Request-Id', id);
  await next();
});
