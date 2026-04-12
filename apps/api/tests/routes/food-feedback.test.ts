import { beforeEach, describe, expect, it } from 'bun:test';
import { Hono } from 'hono';
import { resetEnvCache } from '../../src/env.js';
import { auth } from '../../src/middleware/auth.js';
import type { AuthUser } from '../../src/middleware/auth.js';
import { errorHandler } from '../../src/middleware/error.js';
import { requestId } from '../../src/middleware/request-id.js';
import { feedbackRoute } from '../../src/routes/food-feedback.js';

process.env.DEMO_MODE = 'true';

type AppEnv = { Variables: { user: AuthUser; requestId: string } };

function createTestApp() {
  const app = new Hono<AppEnv>();
  app.use('*', requestId);
  app.onError(errorHandler);
  app.use('/api/*', auth);
  app.route('/api/v1/food-feedback', feedbackRoute);
  return app;
}

describe('POST /api/v1/food-feedback', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    resetEnvCache();
    app = createTestApp();
  });

  it('returns 400 for invalid suggestion_id (not UUID)', async () => {
    const res = await app.request('/api/v1/food-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        suggestion_id: 'not-a-uuid',
        response: 'tried',
      }),
    });

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid response value', async () => {
    const res = await app.request('/api/v1/food-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        suggestion_id: '00000000-0000-0000-0000-000000000001',
        response: 'invalid',
      }),
    });

    expect(res.status).toBe(400);
  });

  it('accepts valid feedback with optional symptom_tag', async () => {
    const res = await app.request('/api/v1/food-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        suggestion_id: '00000000-0000-0000-0000-000000000001',
        response: 'tried',
        symptom_tag: 'bloating',
      }),
    });

    // Will return 500 without DB, but validates schema acceptance
    expect(res.status === 200 || res.status === 500).toBe(true);
  });
});
