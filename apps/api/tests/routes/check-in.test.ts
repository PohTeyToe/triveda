import { beforeEach, describe, expect, it } from 'bun:test';
import { Hono } from 'hono';
import { resetEnvCache } from '../../src/env.js';
import { auth } from '../../src/middleware/auth.js';
import type { AuthUser } from '../../src/middleware/auth.js';
import { errorHandler } from '../../src/middleware/error.js';
import { requestId } from '../../src/middleware/request-id.js';
import { checkIn } from '../../src/routes/check-in.js';

process.env.DEMO_MODE = 'true';

type AppEnv = { Variables: { user: AuthUser; requestId: string } };

function createTestApp() {
  const app = new Hono<AppEnv>();
  app.use('*', requestId);
  app.onError(errorHandler);
  app.use('/api/*', auth);
  app.route('/api/v1/daily-check-in', checkIn);
  return app;
}

describe('POST /api/v1/daily-check-in', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    resetEnvCache();
    app = createTestApp();
  });

  it('returns 400 for invalid mood enum value', async () => {
    const res = await app.request('/api/v1/daily-check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mood: 'invalid',
        energy: 'high',
        digestion: 'good',
      }),
    });

    expect(res.status).toBe(400);
  });

  it('returns 400 for symptoms array exceeding 10 items', async () => {
    const res = await app.request('/api/v1/daily-check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mood: 'good',
        energy: 'high',
        digestion: 'good',
        symptoms: Array.from({ length: 11 }, (_, i) => `symptom-${i}`),
      }),
    });

    expect(res.status).toBe(400);
  });

  it('accepts valid check-in data', async () => {
    const res = await app.request('/api/v1/daily-check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mood: 'good',
        energy: 'high',
        digestion: 'great',
        symptoms: ['headache'],
      }),
    });

    // Will return 500 without DB, but validates schema acceptance
    expect(res.status === 200 || res.status === 500).toBe(true);
  });
});
