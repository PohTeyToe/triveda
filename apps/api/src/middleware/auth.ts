import { createMiddleware } from 'hono/factory';
import * as jose from 'jose';
import { getApiEnv } from '../env.js';
import { DEMO_USER } from '../fixtures/demo-user.js';
import { AppError } from './error.js';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

let jwks: ReturnType<typeof jose.createRemoteJWKSet> | null = null;

function getJWKS(): ReturnType<typeof jose.createRemoteJWKSet> {
  if (jwks) return jwks;
  const env = getApiEnv();
  if (!env.SUPABASE_URL) {
    throw new AppError(500, 'CONFIG_ERROR', 'SUPABASE_URL is not configured');
  }
  const jwksUrl = new URL('/auth/v1/.well-known/jwks.json', env.SUPABASE_URL);
  jwks = jose.createRemoteJWKSet(jwksUrl);
  return jwks;
}

/**
 * JWT auth middleware.
 * - In demo mode: bypasses JWT validation, attaches fixture user.
 * - In production: validates Supabase JWT via JWKS, extracts user claims.
 */
export const auth = createMiddleware(async (c, next) => {
  const env = getApiEnv();

  // Demo mode: skip JWT, attach fixture user
  if (env.DEMO_MODE) {
    c.set('user', {
      id: DEMO_USER.id,
      email: DEMO_USER.email,
      role: 'authenticated',
    } satisfies AuthUser);
    await next();
    return;
  }

  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    throw new AppError(401, 'UNAUTHORIZED', 'Missing or invalid Authorization header');
  }

  const token = header.slice(7);

  try {
    const { payload } = await jose.jwtVerify(token, getJWKS(), {
      algorithms: ['RS256'],
    });

    const user: AuthUser = {
      id: (payload.sub as string) ?? '',
      email: (payload.email as string) ?? '',
      role: (payload.role as string) ?? 'authenticated',
    };

    if (!user.id) {
      throw new AppError(401, 'UNAUTHORIZED', 'JWT missing sub claim');
    }

    c.set('user', user);
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired JWT');
  }

  await next();
});

/**
 * Reset cached JWKS (useful for testing).
 */
export function resetJWKSCache(): void {
  jwks = null;
}
