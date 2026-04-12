import { beforeEach, describe, expect, it } from 'bun:test';
import { createApp } from '../src/app.js';
import { resetEnvCache } from '../src/env.js';

process.env.DEMO_MODE = 'true';
process.env.NODE_ENV = 'development';

describe('CORS middleware', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    resetEnvCache();
    app = createApp();
  });

  it('allows *.vercel.app origins', async () => {
    const res = await app.request('/healthz', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://my-preview-abc123.vercel.app',
        'Access-Control-Request-Method': 'GET',
      },
    });

    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(
      'https://my-preview-abc123.vercel.app',
    );
  });

  it('allows localhost origins', async () => {
    const res = await app.request('/healthz', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
      },
    });

    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173');
  });

  it('rejects unknown origins', async () => {
    const res = await app.request('/healthz', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://evil-site.com',
        'Access-Control-Request-Method': 'GET',
      },
    });

    // Hono CORS returns empty string for rejected origins, which means
    // no Access-Control-Allow-Origin header is set
    const allowOrigin = res.headers.get('Access-Control-Allow-Origin');
    expect(!allowOrigin || allowOrigin === '').toBe(true);
  });

  it('includes correct allowed methods', async () => {
    const res = await app.request('/healthz', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://test.vercel.app',
        'Access-Control-Request-Method': 'POST',
      },
    });

    const methods = res.headers.get('Access-Control-Allow-Methods');
    expect(methods).toContain('GET');
    expect(methods).toContain('POST');
    expect(methods).toContain('PUT');
    expect(methods).toContain('DELETE');
  });
});
