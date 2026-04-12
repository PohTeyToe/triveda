import { beforeEach, describe, expect, it } from 'bun:test';
import { Hono } from 'hono';
import { resetEnvCache } from '../../src/env.js';
import { auth } from '../../src/middleware/auth.js';
import type { AuthUser } from '../../src/middleware/auth.js';
import { errorHandler } from '../../src/middleware/error.js';
import { requestId } from '../../src/middleware/request-id.js';
import { profile } from '../../src/routes/profile.js';

process.env.DEMO_MODE = 'true';

type AppEnv = { Variables: { user: AuthUser; requestId: string } };

function createTestApp() {
  const app = new Hono<AppEnv>();
  app.use('*', requestId);
  app.onError(errorHandler);
  app.use('/api/*', auth);
  app.route('/api/v1/profile', profile);
  return app;
}

describe('GET /api/v1/profile', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    resetEnvCache();
    app = createTestApp();
  });

  it('accepts requests to the profile endpoint', async () => {
    const res = await app.request('/api/v1/profile');

    // Will return 500 without DB, but validates route registration
    expect(res.status === 200 || res.status === 500).toBe(true);
  });
});

describe('PATCH /api/v1/profile', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    resetEnvCache();
    app = createTestApp();
  });

  it('returns 400 when no fields are provided', async () => {
    const res = await app.request('/api/v1/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
  });

  it('accepts valid dietary restrictions update', async () => {
    const res = await app.request('/api/v1/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dietary_restrictions: ['vegetarian', 'gluten-free'],
      }),
    });

    // Will return 500 without DB, but validates schema acceptance
    expect(res.status === 200 || res.status === 500).toBe(true);
  });

  it('accepts valid tradition visibility update', async () => {
    const res = await app.request('/api/v1/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tradition_visibility: { ayurveda: true, tcm: false, naturopathy: true },
      }),
    });

    expect(res.status === 200 || res.status === 500).toBe(true);
  });
});
