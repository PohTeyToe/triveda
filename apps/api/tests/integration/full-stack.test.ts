import { beforeEach, describe, expect, it } from 'bun:test';
import { Hono } from 'hono';
import { resetEnvCache } from '../../src/env.js';
import { type AuthUser, auth } from '../../src/middleware/auth.js';
import { errorHandler } from '../../src/middleware/error.js';
import { requestId } from '../../src/middleware/request-id.js';
import {
  type TelemetryRow,
  setTelemetryWriter,
  telemetry,
} from '../../src/middleware/telemetry.js';
import { constitution } from '../../src/routes/constitution.js';
import { health } from '../../src/routes/health.js';
import { weather } from '../../src/routes/weather.js';

/**
 * Integration tests exercising the middleware stack with multiple routes.
 *
 * Uses demo mode so auth is auto-bypassed. Avoids importing the full app
 * (which pulls in LLM modules with unresolvable paths) by composing a
 * minimal app with the routes under test.
 */

process.env.DEMO_MODE = 'true';

type AppVars = { Variables: { user: AuthUser; requestId: string } };

function createTestApp() {
  const app = new Hono<AppVars>();

  app.use('*', requestId);
  app.onError(errorHandler);
  app.use('*', telemetry);

  // Public routes
  app.route('/healthz', health);
  app.route('/weather', weather);

  // Protected routes
  app.use('/api/*', auth);
  app.route('/api/v1/constitution', constitution);

  return app;
}

describe('Integration: middleware stack', () => {
  let app: ReturnType<typeof createTestApp>;
  let capturedRows: TelemetryRow[];

  beforeEach(() => {
    resetEnvCache();
    capturedRows = [];
    setTelemetryWriter((row) => {
      capturedRows.push(row);
    });
    app = createTestApp();
  });

  // --- Health check ---

  it('GET /healthz returns 200 with status ok', async () => {
    const res = await app.request('/healthz');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(typeof body.uptime).toBe('number');
  });

  // --- Weather route ---

  it('GET /weather with valid params returns 200 with weather data', async () => {
    const res = await app.request('/weather?lat=40.71&lon=-74.01');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(typeof body.temperature).toBe('number');
    expect(typeof body.humidity).toBe('number');
    expect(typeof body.windSpeed).toBe('number');
    expect(typeof body.description).toBe('string');
    expect(typeof body.icon).toBe('string');
  });

  it('GET /weather without lat returns 400', async () => {
    const res = await app.request('/weather?lon=-74.01');
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toHaveProperty('error');
    expect(body).toHaveProperty('requestId');
  });

  // --- Request ID propagation ---

  it('response includes X-Request-Id header', async () => {
    const res = await app.request('/healthz');
    const reqId = res.headers.get('X-Request-Id');
    expect(reqId).toBeTruthy();
  });

  it('preserves client-provided X-Request-Id', async () => {
    const res = await app.request('/healthz', {
      headers: { 'X-Request-Id': 'client-id-123' },
    });
    expect(res.headers.get('X-Request-Id')).toBe('client-id-123');
  });

  // --- Error handling ---

  it('malformed body to constitution assess returns 400 with request_id', async () => {
    const res = await app.request('/api/v1/constitution/assess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: 'not-an-array' }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
    expect(body).toHaveProperty('requestId');
  });

  // --- Telemetry integration ---

  it('telemetry captures request metadata for each request', async () => {
    await app.request('/healthz');

    expect(capturedRows).toHaveLength(1);
    expect(capturedRows[0]?.method).toBe('GET');
    expect(capturedRows[0]?.path).toBe('/healthz');
    expect(capturedRows[0]?.status_code).toBe(200);
    expect(capturedRows[0]?.latency_ms).toBeGreaterThanOrEqual(0);
  });

  it('telemetry request_id matches response header', async () => {
    const res = await app.request('/healthz', {
      headers: { 'X-Request-Id': 'telemetry-test-999' },
    });

    expect(capturedRows).toHaveLength(1);
    expect(capturedRows[0]?.request_id).toBe('telemetry-test-999');
    expect(res.headers.get('X-Request-Id')).toBe('telemetry-test-999');
  });

  // --- Constitution assess (demo mode, DB may fail) ---

  it('POST /constitution/assess with valid answers routes correctly', async () => {
    const res = await app.request('/api/v1/constitution/assess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answers: [
          { questionId: '1', choice: 'a' },
          { questionId: '2', choice: 'b' },
          { questionId: '3', choice: 'c' },
        ],
      }),
    });

    // Route is registered; may be 200, 400 (validation), or 500 (no DB in demo mode)
    expect([200, 400, 500]).toContain(res.status);

    // Telemetry still captures the request
    expect(capturedRows).toHaveLength(1);
    expect(capturedRows[0]?.method).toBe('POST');
  });

  // --- 404 for unknown routes ---

  it('GET /unknown returns 404', async () => {
    const res = await app.request('/unknown-route');
    expect(res.status).toBe(404);
  });
});
