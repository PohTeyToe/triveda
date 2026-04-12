import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { Hono } from 'hono';
import * as jose from 'jose';
import { resetEnvCache } from '../src/env.js';
import { DEMO_USER } from '../src/fixtures/demo-user.js';
import { auth, resetJWKSCache } from '../src/middleware/auth.js';
import type { AuthUser } from '../src/middleware/auth.js';
import { errorHandler } from '../src/middleware/error.js';
import { requestId } from '../src/middleware/request-id.js';

// Generate a test RSA key pair for JWT signing
const { publicKey, privateKey } = await jose.generateKeyPair('RS256');
const publicJWK = await jose.exportJWK(publicKey);
publicJWK.kid = 'test-key-id';
publicJWK.alg = 'RS256';
publicJWK.use = 'sig';

// Mock JWKS server
const jwksServer = Bun.serve({
  port: 0, // random available port
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === '/auth/v1/.well-known/jwks.json') {
      return Response.json({ keys: [publicJWK] });
    }
    return new Response('Not found', { status: 404 });
  },
});

async function createValidJWT(claims?: Record<string, unknown>): Promise<string> {
  return new jose.SignJWT({ email: 'test@example.com', ...claims })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key-id' })
    .setSubject('user-123')
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(privateKey);
}

type AppEnv = { Variables: { user: AuthUser; requestId: string } };

function createAuthTestApp() {
  const app = new Hono<AppEnv>();
  app.use('*', requestId);
  app.onError(errorHandler);
  app.use('/api/*', auth);
  app.get('/api/protected', (c) => {
    const user = c.get('user');
    return c.json({ user });
  });
  return app;
}

describe('Auth middleware', () => {
  beforeEach(() => {
    resetEnvCache();
    resetJWKSCache();
  });

  afterEach(() => {
    resetEnvCache();
  });

  describe('production mode (JWT validation)', () => {
    beforeEach(() => {
      process.env.DEMO_MODE = 'false';
      process.env.SUPABASE_URL = `http://localhost:${jwksServer.port}`;
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_JWKS_URL = `http://localhost:${jwksServer.port}/auth/v1/.well-known/jwks.json`;
      process.env.OPENWEATHER_API_KEY = 'test-weather-key';
      process.env.TRIVEDA_LLM_MODE = 'mock';
      resetEnvCache();
    });

    it('returns 401 without Authorization header', async () => {
      const app = createAuthTestApp();
      const res = await app.request('/api/protected');

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.code).toBe('UNAUTHORIZED');
      expect(body.error).toContain('Missing or invalid Authorization header');
    });

    it('returns 401 with invalid JWT', async () => {
      const app = createAuthTestApp();
      const res = await app.request('/api/protected', {
        headers: { Authorization: 'Bearer invalid-token' },
      });

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.code).toBe('UNAUTHORIZED');
    });

    it('returns 200 with valid Supabase JWT', async () => {
      const app = createAuthTestApp();
      const token = await createValidJWT();
      const res = await app.request('/api/protected', {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.user.id).toBe('user-123');
      expect(body.user.email).toBe('test@example.com');
    });

    it('extracts role from JWT claims', async () => {
      const app = createAuthTestApp();
      const token = await createValidJWT({ role: 'authenticated' });
      const res = await app.request('/api/protected', {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.user.role).toBe('authenticated');
    });

    it('defaults role to authenticated when not in JWT', async () => {
      const app = createAuthTestApp();
      // Create JWT without explicit role claim
      const token = await createValidJWT({});
      const res = await app.request('/api/protected', {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.user.role).toBe('authenticated');
    });
  });

  describe('demo mode (JWT bypass)', () => {
    beforeEach(() => {
      process.env.DEMO_MODE = 'true';
      resetEnvCache();
    });

    it('bypasses JWT and attaches fixture user', async () => {
      const app = createAuthTestApp();
      const res = await app.request('/api/protected');

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.user.id).toBe(DEMO_USER.id);
      expect(body.user.email).toBe(DEMO_USER.email);
    });
  });
});

// Clean up JWKS server after all tests
process.on('beforeExit', () => {
  jwksServer.stop();
});
