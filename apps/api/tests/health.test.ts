import { beforeEach, describe, expect, it } from 'bun:test';
import { createApp } from '../src/app.js';
import { resetEnvCache } from '../src/env.js';

// Set demo mode for all tests by default
process.env.DEMO_MODE = 'true';

describe('GET /healthz', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    resetEnvCache();
    app = createApp();
  });

  it('returns 200 with { status, uptime, version }', async () => {
    const res = await app.request('/healthz');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(typeof body.uptime).toBe('number');
    expect(typeof body.version).toBe('string');
  });

  it('returns 200 in demo mode', async () => {
    process.env.DEMO_MODE = 'true';
    resetEnvCache();
    const demoApp = createApp();

    const res = await demoApp.request('/healthz');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('ok');
  });
});
