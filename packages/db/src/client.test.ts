// client.test.ts -- Unit tests for the database client factory.
//
// These tests mock the postgres driver and drizzle wrapper so they run
// without a live database. They verify:
// - Env validation (missing vars throw clear errors)
// - Singleton behavior (same instance returned on repeat calls)
// - Pooler URL detection (port 6543 disables prepare)
// - Authenticated client receives JWT in connection config
// - closeAll tears down singletons

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock postgres and drizzle-orm before importing the module under test.
const mockEnd = vi.fn().mockResolvedValue(undefined);
const mockSql = Object.assign(vi.fn(), { end: mockEnd });

vi.mock('postgres', () => ({
  default: vi.fn(() => mockSql),
}));

const mockDb = { query: vi.fn() };
vi.mock('drizzle-orm/postgres-js', () => ({
  drizzle: vi.fn(() => mockDb),
}));

// Import after mocks are in place.
import {
  _resetForTesting,
  closeAll,
  createAnonClient,
  createAuthenticatedClient,
  createServiceClient,
  getDb,
} from './client.js';

import postgres from 'postgres';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setEnv(vars: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(vars)) {
    if (value === undefined) {
      clearEnvVar(key);
    } else {
      process.env[key] = value;
    }
  }
}

// Use Reflect.deleteProperty to satisfy biome's noDelete rule
// while still actually removing the key from process.env
// (assigning undefined turns it into the string "undefined").
function clearEnvVar(key: string) {
  Reflect.deleteProperty(process.env, key);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('client factory', () => {
  const FAKE_URL = 'postgresql://user:pass@db.supabase.co:6543/postgres';
  const FAKE_URL_DIRECT = 'postgresql://user:pass@db.supabase.co:5432/postgres';

  beforeEach(() => {
    _resetForTesting();
    vi.clearAllMocks();
    // Clean env
    clearEnvVar('DATABASE_URL');
    clearEnvVar('DATABASE_URL_ANON');
  });

  afterEach(() => {
    clearEnvVar('DATABASE_URL');
    clearEnvVar('DATABASE_URL_ANON');
  });

  // -----------------------------------------------------------------------
  // createServiceClient
  // -----------------------------------------------------------------------
  describe('createServiceClient', () => {
    it('throws if DATABASE_URL is not set', () => {
      expect(() => createServiceClient()).toThrow('DATABASE_URL');
    });

    it('returns a Drizzle client when DATABASE_URL is set', () => {
      setEnv({ DATABASE_URL: FAKE_URL });
      const db = createServiceClient();
      expect(db).toBe(mockDb);
      expect(postgres).toHaveBeenCalledOnce();
    });

    it('returns the same singleton on subsequent calls', () => {
      setEnv({ DATABASE_URL: FAKE_URL });
      const db1 = createServiceClient();
      const db2 = createServiceClient();
      expect(db1).toBe(db2);
      // postgres() should only be called once
      expect(postgres).toHaveBeenCalledOnce();
    });

    it('disables prepare for pooler URLs (port 6543)', () => {
      setEnv({ DATABASE_URL: FAKE_URL });
      createServiceClient();
      const opts = (postgres as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as Record<
        string,
        unknown
      >;
      expect(opts.prepare).toBe(false);
    });

    it('enables prepare for direct URLs (port 5432)', () => {
      setEnv({ DATABASE_URL: FAKE_URL_DIRECT });
      createServiceClient();
      const opts = (postgres as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as Record<
        string,
        unknown
      >;
      expect(opts.prepare).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // createAnonClient
  // -----------------------------------------------------------------------
  describe('createAnonClient', () => {
    it('throws if neither DATABASE_URL_ANON nor DATABASE_URL is set', () => {
      expect(() => createAnonClient()).toThrow('DATABASE_URL_ANON');
    });

    it('prefers DATABASE_URL_ANON over DATABASE_URL', () => {
      const anonUrl = 'postgresql://anon:pass@db.supabase.co:6543/postgres';
      setEnv({ DATABASE_URL_ANON: anonUrl, DATABASE_URL: FAKE_URL });
      createAnonClient();
      expect(postgres).toHaveBeenCalledWith(anonUrl, expect.any(Object));
    });

    it('falls back to DATABASE_URL if DATABASE_URL_ANON is not set', () => {
      setEnv({ DATABASE_URL: FAKE_URL });
      createAnonClient();
      expect(postgres).toHaveBeenCalledWith(FAKE_URL, expect.any(Object));
    });

    it('returns the same singleton on subsequent calls', () => {
      setEnv({ DATABASE_URL: FAKE_URL });
      const db1 = createAnonClient();
      const db2 = createAnonClient();
      expect(db1).toBe(db2);
      expect(postgres).toHaveBeenCalledOnce();
    });
  });

  // -----------------------------------------------------------------------
  // createAuthenticatedClient
  // -----------------------------------------------------------------------
  describe('createAuthenticatedClient', () => {
    it('throws if jwt is empty', () => {
      setEnv({ DATABASE_URL: FAKE_URL });
      expect(() => createAuthenticatedClient('')).toThrow('JWT');
    });

    it('throws if DATABASE_URL is not set', () => {
      expect(() => createAuthenticatedClient('some.jwt.token')).toThrow('DATABASE_URL');
    });

    it('passes JWT in connection options', () => {
      setEnv({ DATABASE_URL: FAKE_URL });
      createAuthenticatedClient('my.jwt.token');
      const opts = (postgres as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as Record<
        string,
        unknown
      >;
      const conn = opts.connection as Record<string, string>;
      expect(conn['request.jwt.claims']).toBe('my.jwt.token');
      expect(conn.role).toBe('authenticated');
    });

    it('creates a new connection each time (not a singleton)', () => {
      setEnv({ DATABASE_URL: FAKE_URL });
      createAuthenticatedClient('jwt-1');
      createAuthenticatedClient('jwt-2');
      expect(postgres).toHaveBeenCalledTimes(2);
    });

    it('returns a close function that ends the connection', async () => {
      setEnv({ DATABASE_URL: FAKE_URL });
      const { close } = createAuthenticatedClient('my.jwt.token');
      await close();
      expect(mockEnd).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // getDb
  // -----------------------------------------------------------------------
  describe('getDb', () => {
    it('returns the service client singleton', () => {
      setEnv({ DATABASE_URL: FAKE_URL });
      const db = getDb();
      expect(db).toBe(mockDb);
    });
  });

  // -----------------------------------------------------------------------
  // closeAll
  // -----------------------------------------------------------------------
  describe('closeAll', () => {
    it('closes service and anon singletons', async () => {
      setEnv({ DATABASE_URL: FAKE_URL, DATABASE_URL_ANON: FAKE_URL });
      createServiceClient();
      createAnonClient();
      vi.clearAllMocks();

      await closeAll();
      // end() called twice -- once for service, once for anon
      expect(mockEnd).toHaveBeenCalledTimes(2);
    });

    it('is safe to call when no clients are initialized', async () => {
      await expect(closeAll()).resolves.toBeUndefined();
    });

    it('resets singletons so next call creates new connections', async () => {
      setEnv({ DATABASE_URL: FAKE_URL });
      createServiceClient();
      await closeAll();
      vi.clearAllMocks();

      createServiceClient();
      expect(postgres).toHaveBeenCalledOnce();
    });
  });
});
