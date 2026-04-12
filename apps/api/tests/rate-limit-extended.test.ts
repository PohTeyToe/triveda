import { beforeEach, describe, expect, it } from 'bun:test';
import { Hono } from 'hono';
import { resetEnvCache } from '../src/env.js';
import { RATE_LIMITS, createRateLimiter } from '../src/middleware/rate-limit.js';
import { requestId } from '../src/middleware/request-id.js';

process.env.DEMO_MODE = 'true';

describe('Per-route rate limits', () => {
  beforeEach(() => {
    resetEnvCache();
  });

  it('RATE_LIMITS has expected route groups', () => {
    const assessConfig = RATE_LIMITS['constitution-assess'];
    expect(assessConfig).toBeDefined();
    expect(assessConfig?.limit).toBe(10);
    const uploadConfig = RATE_LIMITS['blood-work-upload'];
    expect(uploadConfig).toBeDefined();
    expect(uploadConfig?.limit).toBe(5);
    const dailyConfig = RATE_LIMITS['daily-food'];
    expect(dailyConfig).toBeDefined();
    expect(dailyConfig?.limit).toBe(30);
    const defaultConfig = RATE_LIMITS.default;
    expect(defaultConfig).toBeDefined();
    expect(defaultConfig?.limit).toBe(60);
  });

  it('constitution/assess rate limiter returns 429 after 10 requests', async () => {
    const app = new Hono();
    app.use('*', requestId);
    const limiter = createRateLimiter('constitution-assess');
    app.use('/test', limiter);
    app.get('/test', (c) => c.json({ ok: true }));

    // Send 10 requests (all should pass)
    for (let i = 0; i < 10; i++) {
      const res = await app.request('/test', {
        headers: { 'X-Forwarded-For': '10.0.0.1' },
      });
      expect(res.status).toBe(200);
    }

    // 11th request should be rate limited
    const res = await app.request('/test', {
      headers: { 'X-Forwarded-For': '10.0.0.1' },
    });
    expect(res.status).toBe(429);
  });

  it('429 response includes Retry-After header', async () => {
    const app = new Hono();
    app.use('*', requestId);
    const limiter = createRateLimiter('blood-work-upload');
    app.use('/upload', limiter);
    app.post('/upload', (c) => c.json({ ok: true }));

    // Exhaust the limit (5 requests)
    for (let i = 0; i < 5; i++) {
      await app.request('/upload', {
        method: 'POST',
        headers: { 'X-Forwarded-For': '10.0.0.2' },
      });
    }

    // 6th should be 429 with Retry-After
    const res = await app.request('/upload', {
      method: 'POST',
      headers: { 'X-Forwarded-For': '10.0.0.2' },
    });
    expect(res.status).toBe(429);
    const retryAfter = res.headers.get('Retry-After');
    expect(retryAfter).toBeTruthy();
  });

  it('different IPs have independent rate limit counters', async () => {
    const app = new Hono();
    app.use('*', requestId);
    const limiter = createRateLimiter('constitution-assess');
    app.use('/test', limiter);
    app.get('/test', (c) => c.json({ ok: true }));

    // IP A: exhaust the limit
    for (let i = 0; i < 10; i++) {
      await app.request('/test', {
        headers: { 'X-Forwarded-For': '10.0.0.10' },
      });
    }

    // IP A should be blocked
    const resA = await app.request('/test', {
      headers: { 'X-Forwarded-For': '10.0.0.10' },
    });
    expect(resA.status).toBe(429);

    // IP B should still work
    const resB = await app.request('/test', {
      headers: { 'X-Forwarded-For': '10.0.0.11' },
    });
    expect(resB.status).toBe(200);
  });

  it('createRateLimiter falls back to default config for unknown group', () => {
    // Should not throw
    const limiter = createRateLimiter('nonexistent-route' as keyof typeof RATE_LIMITS);
    expect(limiter).toBeDefined();
  });
});
