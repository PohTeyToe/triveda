import { SignJWT, exportJWK, generateKeyPair, type JWK } from 'jose';

/**
 * JWT fixtures for auth middleware tests. Uses RS256 via `jose` so the
 * test keypair matches the production Supabase JWKS signing algorithm.
 */

export interface TestKeyPair {
  privateKey: CryptoKey;
  publicKey: CryptoKey;
  publicJwk: JWK;
}

export async function generateTestKeyPair(): Promise<TestKeyPair> {
  const { privateKey, publicKey } = await generateKeyPair('RS256', { extractable: true });
  const publicJwk = await exportJWK(publicKey);
  publicJwk.kid = 'test-key-1';
  publicJwk.alg = 'RS256';
  publicJwk.use = 'sig';
  return { privateKey, publicKey, publicJwk };
}

export function createTestJWKS(publicJwk: JWK): { keys: JWK[] } {
  return { keys: [publicJwk] };
}

export interface SignOptions {
  expiresIn?: string;
  expired?: boolean;
  kid?: string;
}

export async function signTestJWT(
  payload: Record<string, unknown>,
  privateKey: CryptoKey,
  options: SignOptions = {},
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expIn = options.expired ? -3600 : 3600;
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'RS256', kid: options.kid ?? 'test-key-1' })
    .setIssuedAt(now - 60)
    .setExpirationTime(now + expIn)
    .sign(privateKey);
}

export const demoUserPayload = {
  sub: '00000000-0000-0000-0000-000000000001',
  email: 'demo@triveda.app',
  role: 'authenticated',
} as const;
