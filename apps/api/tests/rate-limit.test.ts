import { beforeEach, describe, expect, it } from 'bun:test';
import { createApp } from '../src/app.js';
import { resetEnvCache } from '../src/env.js';

process.env.DEMO_MODE = 'true';

describe('Rate limiter', () => {
  beforeEach(() => {
    resetEnvCache();
  });

  it('returns 429 after 100 requests in 1 minute from same IP', async () => {
    // Create a fresh app for this test to get a fresh rate limiter store
    const app = createApp();

    // Send 100 requests (all should pass)
    for (let i = 0; i < 100; i++) {
      const res = await app.request('/healthz', {
        headers: { 'X-Forwarded-For': '1.2.3.4' },
      });
      expect(res.status).toBe(200);
    }

    // 101st request should be rate limited
    const res = await app.request('/healthz', {
      headers: { 'X-Forwarded-For': '1.2.3.4' },
    });
    expect(res.status).toBe(429);
  });
});
