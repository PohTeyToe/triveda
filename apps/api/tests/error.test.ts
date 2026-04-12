import { beforeEach, describe, expect, it } from 'bun:test';
import { Hono } from 'hono';
import { ZodError, z } from 'zod';
import { resetEnvCache } from '../src/env.js';
import { AppError, errorHandler } from '../src/middleware/error.js';
import { requestId } from '../src/middleware/request-id.js';

process.env.DEMO_MODE = 'true';

describe('Error handler', () => {
  let app: Hono;

  beforeEach(() => {
    resetEnvCache();
    app = new Hono();
    app.use('*', requestId);
    app.onError(errorHandler);
  });

  it('returns structured error envelope with requestId', async () => {
    app.get('/fail', () => {
      throw new Error('Something went wrong');
    });

    const res = await app.request('/fail');
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error).toBeTruthy();
    expect(body.code).toBe('INTERNAL_ERROR');
    expect(body.requestId).toBeTruthy();
    expect(body.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('maps AppError to correct status and code', async () => {
    app.get('/app-error', () => {
      throw new AppError(403, 'FORBIDDEN', 'You shall not pass');
    });

    const res = await app.request('/app-error');
    expect(res.status).toBe(403);

    const body = await res.json();
    expect(body.error).toBe('You shall not pass');
    expect(body.code).toBe('FORBIDDEN');
  });

  it('maps ZodError to 400 VALIDATION_ERROR', async () => {
    app.get('/validation', () => {
      const schema = z.object({ name: z.string().min(1) });
      schema.parse({ name: '' });
      return new Response(); // unreachable
    });

    const res = await app.request('/validation');
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.error).toBeTruthy();
  });

  it('hides error details in production mode', async () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    app.get('/leak', () => {
      throw new Error('secret database error details');
    });

    const res = await app.request('/leak');
    const body = await res.json();
    expect(body.error).toBe('Internal server error');
    expect(body.error).not.toContain('secret');

    process.env.NODE_ENV = origEnv;
  });
});
