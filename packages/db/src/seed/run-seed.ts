#!/usr/bin/env tsx
// run-seed.ts -- CLI entry point for the seed orchestrator.
//
// Usage:
//   pnpm --filter @triveda/db db:seed
//   pnpm --filter @triveda/db db:seed --skip-validation
//
// Connects to the database via DATABASE_URL, runs the full seed pipeline,
// then closes the connection and exits.

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

// Resolve __dirname for both ESM and CJS contexts
const _dirname =
  typeof __dirname !== 'undefined' ? __dirname : dirname(fileURLToPath(import.meta.url));

// Load .env.local from the monorepo root (two levels up from packages/db/src/seed)
config({ path: resolve(_dirname, '../../../../.env.local') });
config({ path: resolve(_dirname, '../../../../.env') });

import { closeAll, createServiceClient } from '../client.js';
import { runFullSeed } from './orchestrator.js';

async function main() {
  const args = process.argv.slice(2);
  const skipValidation = args.includes('--skip-validation');

  // Prefer direct connection for seed scripts (bypasses Supavisor pooler).
  // Pooler (port 6543) can have tenant resolution issues with large batches.
  if (process.env.DATABASE_URL_DIRECT) {
    process.env.DATABASE_URL = process.env.DATABASE_URL_DIRECT;
  }

  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL is not set.');
    console.error('Set it in .env.local or as an environment variable.');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const db = createServiceClient();

  try {
    const result = await runFullSeed(db, { skipValidation });

    if (result.foods.total === 0 && result.herbs.total === 0) {
      console.warn('WARNING: No foods or herbs were seeded. Check seed data files.');
      process.exit(1);
    }

    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await closeAll();
  }
}

main();
