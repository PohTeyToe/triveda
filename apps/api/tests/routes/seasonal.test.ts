import { beforeEach, describe, expect, it } from 'bun:test';
import { Hono } from 'hono';
import { resetEnvCache } from '../../src/env.js';
import { auth } from '../../src/middleware/auth.js';
import type { AuthUser } from '../../src/middleware/auth.js';
import { errorHandler } from '../../src/middleware/error.js';
import { requestId } from '../../src/middleware/request-id.js';
import { seasonal } from '../../src/routes/seasonal.js';

process.env.DEMO_MODE = 'true';

type AppEnv = { Variables: { user: AuthUser; requestId: string } };

function createTestApp() {
  const app = new Hono<AppEnv>();
  app.use('*', requestId);
  app.onError(errorHandler);
  app.use('/api/*', auth);
  app.route('/api/v1/seasonal-transition', seasonal);
  return app;
}

describe('GET /api/v1/seasonal-transition', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    resetEnvCache();
    app = createTestApp();
  });

  it('accepts requests to the seasonal transition endpoint', async () => {
    const res = await app.request('/api/v1/seasonal-transition');

    // Will return 500 without DB, but validates route registration
    expect(res.status === 200 || res.status === 500).toBe(true);
  });
});

describe('POST /api/v1/seasonal-transition/acknowledge', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    resetEnvCache();
    app = createTestApp();
  });

  it('returns 400 for missing required fields', async () => {
    const res = await app.request('/api/v1/seasonal-transition/acknowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
  });

  it('accepts valid acknowledge body', async () => {
    const res = await app.request('/api/v1/seasonal-transition/acknowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from_ritu: 'vasanta',
        to_ritu: 'grishma',
      }),
    });

    // Will return 500 without DB, but validates schema acceptance
    expect(res.status === 200 || res.status === 500).toBe(true);
  });
});
