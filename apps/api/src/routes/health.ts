import { Hono } from 'hono';

const health = new Hono();

/**
 * GET /healthz — public health check endpoint.
 * Returns server status, uptime, and version.
 */
health.get('/', (c) => {
  return c.json({
    status: 'ok' as const,
    uptime: process.uptime(),
    version: process.env.npm_package_version ?? '0.0.0',
  });
});

export { health };
