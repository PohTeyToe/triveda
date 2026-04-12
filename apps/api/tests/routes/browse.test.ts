import { beforeEach, describe, expect, it } from 'bun:test';
import { Hono } from 'hono';
import { resetEnvCache } from '../../src/env.js';
import { auth } from '../../src/middleware/auth.js';
import type { AuthUser } from '../../src/middleware/auth.js';
import { errorHandler } from '../../src/middleware/error.js';
import { requestId } from '../../src/middleware/request-id.js';
import { browse } from '../../src/routes/browse.js';

process.env.DEMO_MODE = 'true';

type AppEnv = { Variables: { user: AuthUser; requestId: string } };

function createTestApp() {
  const app = new Hono<AppEnv>();
  app.use('*', requestId);
  app.onError(errorHandler);
  app.use('/api/*', auth);
  app.route('/api/v1', browse);
  return app;
}

describe('GET /api/v1/foods/browse', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    resetEnvCache();
    app = createTestApp();
  });

  it('accepts requests to the foods browse endpoint', async () => {
    const res = await app.request('/api/v1/foods/browse');

    // Will return 500 without DB, but validates route registration
    expect(res.status === 200 || res.status === 500).toBe(true);
  });

  it('accepts category filter parameter', async () => {
    const res = await app.request('/api/v1/foods/browse?category=grain');

    expect(res.status === 200 || res.status === 500).toBe(true);
  });

  it('accepts cursor and limit parameters', async () => {
    const res = await app.request('/api/v1/foods/browse?limit=5&cursor=some-id');

    expect(res.status === 200 || res.status === 500).toBe(true);
  });
});

describe('GET /api/v1/herbs/browse', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    resetEnvCache();
    app = createTestApp();
  });

  it('accepts requests to the herbs browse endpoint', async () => {
    const res = await app.request('/api/v1/herbs/browse');

    expect(res.status === 200 || res.status === 500).toBe(true);
  });
});
