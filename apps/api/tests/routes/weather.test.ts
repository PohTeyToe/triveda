import { beforeEach, describe, expect, it } from 'bun:test';
import { Hono } from 'hono';
import { resetEnvCache } from '../../src/env.js';
import { errorHandler } from '../../src/middleware/error.js';
import { requestId } from '../../src/middleware/request-id.js';
import { weather } from '../../src/routes/weather.js';

process.env.DEMO_MODE = 'true';

function createTestApp() {
  const app = new Hono();
  app.use('*', requestId);
  app.onError(errorHandler);
  app.route('/weather', weather);
  return app;
}

describe('GET /weather', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    resetEnvCache();
    app = createTestApp();
  });

  it('returns 200 with valid lat/lon', async () => {
    const res = await app.request('/weather?lat=40.71&lon=-74.01');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('temperature');
    expect(body).toHaveProperty('humidity');
    expect(body).toHaveProperty('windSpeed');
    expect(body).toHaveProperty('description');
    expect(body).toHaveProperty('icon');
  });

  it('response shape matches WeatherData interface', async () => {
    const res = await app.request('/weather?lat=40.71&lon=-74.01');
    const body = await res.json();

    expect(typeof body.temperature).toBe('number');
    expect(typeof body.humidity).toBe('number');
    expect(typeof body.windSpeed).toBe('number');
    expect(typeof body.description).toBe('string');
    expect(typeof body.icon).toBe('string');
  });

  it('works without auth (allow_anon)', async () => {
    // No auth middleware registered, no auth header
    const res = await app.request('/weather?lat=0&lon=0');
    expect(res.status).toBe(200);
  });

  it('returns 400 with missing lat', async () => {
    const res = await app.request('/weather?lon=-74.01');
    expect(res.status).toBe(400);
  });

  it('returns 400 with invalid lon (> 180)', async () => {
    const res = await app.request('/weather?lat=40&lon=200');
    expect(res.status).toBe(400);
  });

  it('returns 400 with lat as string "abc"', async () => {
    const res = await app.request('/weather?lat=abc&lon=-74');
    expect(res.status).toBe(400);
  });
});
