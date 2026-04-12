// client.ts -- Database client factory for Triveda.
//
// Provides three connection modes:
//
// 1. Service client (createServiceClient) -- bypasses RLS.
//    Uses DATABASE_URL with service role credentials.
//    For seed scripts, validation pipeline, and admin operations.
//
// 2. Anon client (createAnonClient) -- respects RLS.
//    Uses DATABASE_URL_ANON (or DATABASE_URL with anon-role pooler credentials).
//    For public read queries from the backend API.
//
// 3. Authenticated client (createAuthenticatedClient) -- per-request.
//    Sets the user JWT on the connection so auth.uid() resolves in RLS policies.
//    Used by split 06 (backend API) for user-scoped queries.
//
// Connection notes:
// - Supavisor pooler (port 6543): set prepare: false (required for transaction mode)
// - Direct connection (port 5432): prepare is fine, use for migrations
// - The migrate.ts script manages its own connection; this file is for app runtime.

import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema/index.js';

// Re-export the schema type for downstream consumers.
export type DbSchema = typeof schema;
export type DbClient = PostgresJsDatabase<DbSchema>;

// ---------------------------------------------------------------------------
// Internal: detect whether a connection string uses the Supavisor pooler
// (port 6543) vs. a direct connection (port 5432).
// ---------------------------------------------------------------------------
function isPoolerUrl(url: string): boolean {
  try {
    // postgres:// URLs are not valid URL objects, but replacing the scheme works.
    const parsed = new URL(url.replace(/^postgres(ql)?:\/\//, 'http://'));
    return parsed.port === '6543';
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Internal: create a Drizzle-wrapped Postgres.js client.
// ---------------------------------------------------------------------------
function createDb(connectionString: string): {
  db: DbClient;
  sql: postgres.Sql;
} {
  const pooler = isPoolerUrl(connectionString);

  const sql = postgres(connectionString, {
    // Supavisor transaction mode does not support prepared statements.
    prepare: !pooler,
    // Limit idle connections. Seed scripts and one-off queries need very few.
    max: 10,
    // Idle timeout in seconds -- close connections sitting idle for 20s.
    idle_timeout: 20,
  });

  const db = drizzle(sql, { schema });

  return { db, sql };
}

// ---------------------------------------------------------------------------
// Service client -- singleton
// ---------------------------------------------------------------------------
let _serviceClient: { db: DbClient; sql: postgres.Sql } | null = null;

/**
 * Returns a Drizzle client using the service role connection string.
 * This client bypasses RLS entirely. Use for seed scripts, admin ops,
 * and the validation pipeline.
 *
 * Reads DATABASE_URL from the environment. Throws if not set.
 * The returned instance is a singleton -- subsequent calls return the same client.
 */
export function createServiceClient(): DbClient {
  if (_serviceClient) return _serviceClient.db;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL environment variable is required for createServiceClient(). ' +
        'Set it to the Supabase connection string with service-role credentials.',
    );
  }

  _serviceClient = createDb(url);
  return _serviceClient.db;
}

// ---------------------------------------------------------------------------
// Anon client -- singleton
// ---------------------------------------------------------------------------
let _anonClient: { db: DbClient; sql: postgres.Sql } | null = null;

/**
 * Returns a Drizzle client using anon-role credentials.
 * This client respects RLS policies. Use for public read queries
 * from the backend API when no user context is needed.
 *
 * Reads DATABASE_URL_ANON from the environment (falls back to DATABASE_URL
 * if DATABASE_URL_ANON is not set -- the caller is responsible for ensuring
 * the connection string uses the correct role).
 */
export function createAnonClient(): DbClient {
  if (_anonClient) return _anonClient.db;

  const url = process.env.DATABASE_URL_ANON || process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL_ANON (or DATABASE_URL) environment variable is required for createAnonClient(). ' +
        'Set it to the Supabase connection string with anon-role credentials.',
    );
  }

  _anonClient = createDb(url);
  return _anonClient.db;
}

// ---------------------------------------------------------------------------
// Authenticated client -- per-request, NOT a singleton
// ---------------------------------------------------------------------------

/**
 * Creates a Drizzle client that sets the user's JWT on the connection.
 * This makes auth.uid() resolve correctly in Supabase RLS policies.
 *
 * **Important:** This creates a new connection per call. The backend API
 * (split 06) should call this once per request and close the connection
 * when the request is done by calling the returned `close()` function.
 *
 * Usage in an Express/Fastify handler:
 * ```ts
 * const jwt = req.headers.authorization?.replace('Bearer ', '');
 * const { db, close } = createAuthenticatedClient(jwt);
 * try {
 *   const rows = await db.select().from(foods);
 *   return rows;
 * } finally {
 *   await close();
 * }
 * ```
 */
export function createAuthenticatedClient(jwt: string): {
  db: DbClient;
  close: () => Promise<void>;
} {
  if (!jwt) {
    throw new Error(
      'A valid JWT is required for createAuthenticatedClient(). ' +
        'Extract it from the Authorization header.',
    );
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL environment variable is required for createAuthenticatedClient().',
    );
  }

  const pooler = isPoolerUrl(url);

  const sql = postgres(url, {
    prepare: !pooler,
    max: 1,
    idle_timeout: 20,
    // Set the Supabase auth context on every new connection.
    // This makes auth.uid() and auth.role() work in RLS policies.
    connection: {
      'request.jwt.claims': jwt,
      role: 'authenticated',
    },
  });

  const db = drizzle(sql, { schema });

  return {
    db,
    close: () => sql.end(),
  };
}

// ---------------------------------------------------------------------------
// Default export: convenience singleton for scripts and internal use
// ---------------------------------------------------------------------------

/**
 * Returns the default database client (service role, singleton).
 * Alias for createServiceClient(). Use this in seed scripts:
 *
 * ```ts
 * import { getDb } from '@triveda/db';
 * const db = getDb();
 * ```
 */
export function getDb(): DbClient {
  return createServiceClient();
}

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

/**
 * Closes all singleton database connections. Call this on process exit
 * to avoid dangling connections.
 */
export async function closeAll(): Promise<void> {
  const promises: Promise<void>[] = [];
  if (_serviceClient) {
    promises.push(_serviceClient.sql.end());
    _serviceClient = null;
  }
  if (_anonClient) {
    promises.push(_anonClient.sql.end());
    _anonClient = null;
  }
  await Promise.all(promises);
}

// ---------------------------------------------------------------------------
// Internal: reset singletons for testing
// ---------------------------------------------------------------------------
export function _resetForTesting(): void {
  _serviceClient = null;
  _anonClient = null;
}
