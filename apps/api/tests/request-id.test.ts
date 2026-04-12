import { beforeEach, describe, expect, it } from 'bun:test';
import { createApp } from '../src/app.js';
import { resetEnvCache } from '../src/env.js';

process.env.DEMO_MODE = 'true';

describe('Request ID middleware', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    resetEnvCache();
    app = createApp();
  });

  it('attaches X-Request-Id header to every response', async () => {
    const res = await app.request('/healthz');
    const requestId = res.headers.get('X-Request-Id');

    expect(requestId).toBeTruthy();
    // UUID v4 format
    expect(requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('generates unique request IDs per request', async () => {
    const res1 = await app.request('/healthz');
    const res2 = await app.request('/healthz');

    const id1 = res1.headers.get('X-Request-Id');
    const id2 = res2.headers.get('X-Request-Id');

    expect(id1).not.toBe(id2);
  });
});
