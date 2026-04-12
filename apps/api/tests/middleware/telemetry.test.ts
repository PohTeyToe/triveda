import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { Hono } from 'hono';
import { resetEnvCache } from '../../src/env.js';
import { type AuthUser, auth } from '../../src/middleware/auth.js';
import { requestId } from '../../src/middleware/request-id.js';
import {
  type TelemetryRow,
  setTelemetryWriter,
  telemetry,
} from '../../src/middleware/telemetry.js';

process.env.DEMO_MODE = 'true';

describe('Telemetry middleware', () => {
  let capturedRows: TelemetryRow[];

  beforeEach(() => {
    resetEnvCache();
    capturedRows = [];
    setTelemetryWriter((row) => {
      capturedRows.push(row);
    });
  });

  afterEach(() => {
    // Reset to console writer
    setTelemetryWriter((row) => {
      console.log(JSON.stringify({ type: 'telemetry', ...row }));
    });
  });

  function createApp(opts?: { withAuth?: boolean }) {
    type Vars = { user: AuthUser; requestId: string };
    const app = new Hono<{ Variables: Vars }>();
    app.use('*', requestId);
    app.use('*', telemetry);

    if (opts?.withAuth) {
      app.use('/api/*', auth);
    }

    app.get('/test', (c) => c.json({ ok: true }));
    app.get('/api/test', (c) => c.json({ ok: true }));
    app.get('/fail', (c) => c.json({ error: 'bad' }, 400));

    return app;
  }

  it('successful GET writes telemetry row with status_code 200', async () => {
    const app = createApp();
    await app.request('/test');

    expect(capturedRows).toHaveLength(1);
    expect(capturedRows[0]?.status_code).toBe(200);
  });

  it('failed request writes telemetry row with correct status_code', async () => {
    const app = createApp();
    await app.request('/fail');

    expect(capturedRows).toHaveLength(1);
    expect(capturedRows[0]?.status_code).toBe(400);
  });

  it('telemetry row has matching request_id', async () => {
    const app = createApp();
    const res = await app.request('/test', {
      headers: { 'X-Request-Id': 'test-req-123' },
    });

    expect(capturedRows).toHaveLength(1);
    expect(capturedRows[0]?.request_id).toBe('test-req-123');
    expect(res.headers.get('X-Request-Id')).toBe('test-req-123');
  });

  it('anonymous request writes null user_id', async () => {
    const app = createApp();
    await app.request('/test');

    expect(capturedRows).toHaveLength(1);
    expect(capturedRows[0]?.user_id).toBeNull();
  });

  it('authenticated request writes correct user_id', async () => {
    const app = createApp({ withAuth: true });
    await app.request('/api/test');

    expect(capturedRows).toHaveLength(1);
    // Demo mode auto-authenticates with fixture user
    expect(capturedRows[0]?.user_id).toBe('demo-user-00000000-0000-0000-0000-000000000000');
  });

  it('telemetry insert failure does not affect HTTP response', async () => {
    setTelemetryWriter(() => {
      throw new Error('DB insert failed');
    });

    const app = createApp();
    const res = await app.request('/test');

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });

  it('latency_ms is a positive integer', async () => {
    const app = createApp();
    await app.request('/test');

    expect(capturedRows).toHaveLength(1);
    expect(capturedRows[0]?.latency_ms).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(capturedRows[0]?.latency_ms)).toBe(true);
  });

  it('includes correct method and path', async () => {
    const app = createApp();
    await app.request('/test');

    expect(capturedRows).toHaveLength(1);
    expect(capturedRows[0]?.method).toBe('GET');
    expect(capturedRows[0]?.path).toBe('/test');
  });
});
