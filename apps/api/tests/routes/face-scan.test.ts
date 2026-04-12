import { beforeEach, describe, expect, it } from 'bun:test';
import { Hono } from 'hono';
import { resetEnvCache } from '../../src/env.js';
import { auth } from '../../src/middleware/auth.js';
import type { AuthUser } from '../../src/middleware/auth.js';
import { errorHandler } from '../../src/middleware/error.js';
import { requestId } from '../../src/middleware/request-id.js';
import { faceScan } from '../../src/routes/face-scan.js';

process.env.DEMO_MODE = 'true';

type AppEnv = { Variables: { user: AuthUser; requestId: string } };

function createTestApp() {
  const app = new Hono<AppEnv>();
  app.use('*', requestId);
  app.onError(errorHandler);
  app.use('/api/*', auth);
  app.route('/api/v1/face-scan', faceScan);
  return app;
}

describe('POST /api/v1/face-scan', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    resetEnvCache();
    app = createTestApp();
  });

  it('returns 400 for missing required fields', async () => {
    const res = await app.request('/api/v1/face-scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vata_delta: 0.1 }),
    });

    expect(res.status).toBe(400);
  });

  it('returns 400 for confidence out of range', async () => {
    const res = await app.request('/api/v1/face-scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vata_delta: 0.1,
        pitta_delta: -0.1,
        kapha_delta: 0.0,
        wood_hint: 0.3,
        fire_hint: 0.4,
        earth_hint: 0.5,
        metal_hint: 0.2,
        water_hint: 0.6,
        stress_level: 0.3,
        skin_tone: 'medium',
        confidence: 0.9, // out of range (max 0.7)
        simulated: true,
        generated_at: new Date().toISOString(),
        seed_hour: 10,
      }),
    });

    expect(res.status).toBe(400);
  });

  it('accepts valid face scan data', async () => {
    const res = await app.request('/api/v1/face-scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vata_delta: 0.1,
        pitta_delta: -0.1,
        kapha_delta: 0.0,
        wood_hint: 0.3,
        fire_hint: 0.4,
        earth_hint: 0.5,
        metal_hint: 0.2,
        water_hint: 0.6,
        stress_level: 0.3,
        skin_tone: 'medium',
        confidence: 0.5,
        simulated: true,
        generated_at: new Date().toISOString(),
        seed_hour: 10,
      }),
    });

    // Will return 500 without DB, but validates schema acceptance
    expect(res.status === 200 || res.status === 500).toBe(true);
  });

  it('returns 400 when simulated is not true', async () => {
    const res = await app.request('/api/v1/face-scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vata_delta: 0.1,
        pitta_delta: -0.1,
        kapha_delta: 0.0,
        wood_hint: 0.3,
        fire_hint: 0.4,
        earth_hint: 0.5,
        metal_hint: 0.2,
        water_hint: 0.6,
        stress_level: 0.3,
        skin_tone: 'medium',
        confidence: 0.5,
        simulated: false,
        generated_at: new Date().toISOString(),
        seed_hour: 10,
      }),
    });

    expect(res.status).toBe(400);
  });
});
