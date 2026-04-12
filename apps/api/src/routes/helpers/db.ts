/**
 * Database accessor for route handlers.
 *
 * In demo mode, returns undefined (routes must handle missing DB gracefully).
 * In production, returns the service client singleton.
 *
 * Routes that need user-scoped RLS should use createAuthenticatedClient
 * instead, but for this initial implementation we use the service client
 * with manual user_id filtering.
 */

import { createServiceClient } from '@triveda/db';
import type { DbClient } from '@triveda/db';
import { getApiEnv } from '../../env.js';

let _mockDb: DbClient | null = null;

/**
 * Get the database client. Returns the service client in production,
 * or a mock client if one has been set for testing.
 */
export function getDb(): DbClient {
  if (_mockDb) return _mockDb;

  const env = getApiEnv();
  if (env.DEMO_MODE && !env.DATABASE_URL) {
    throw new Error(
      'Database not available in demo mode without DATABASE_URL. ' +
        'Set DATABASE_URL or use setMockDb() for testing.',
    );
  }

  return createServiceClient();
}

/**
 * Set a mock database client for testing.
 */
export function setMockDb(db: DbClient | null): void {
  _mockDb = db;
}
