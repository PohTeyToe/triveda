// migrate.ts -- Runs all migrations against the database.
//
// Hand-written migrations (extensions, RLS) run as raw SQL before the
// drizzle-kit managed migration (table creation). This avoids meta/ journal
// conflicts while keeping a single entry point: `pnpm db:migrate`.
//
// Usage: DATABASE_URL=postgresql://... npx tsx migrate.ts

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Prefer DATABASE_URL_DIRECT (bypasses pgBouncer) for migrations.
// Falls back to DATABASE_URL if direct is not set.
const databaseUrl = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL or DATABASE_URL_DIRECT environment variable is required.');
  process.exit(1);
}

// Hand-written SQL files to run before drizzle-kit migrations.
// These use IF NOT EXISTS / IF NOT EXISTS guards for idempotency.
const manualMigrations = [
  '0001_create_extensions.sql',
  '0003_rls_reference_tables.sql',
  '0004_create_user_profiles_rls.sql',
];

async function main() {
  // databaseUrl is guaranteed non-null by the guard above.
  const sql = postgres(databaseUrl as string, { max: 1 });
  const db = drizzle(sql);

  try {
    // Step 1: Run hand-written extension migration first (must exist before tables)
    const extFile = join(__dirname, 'migrations', '0001_create_extensions.sql');
    const extSql = readFileSync(extFile, 'utf-8');
    console.log('[migrate] Running 0001_create_extensions.sql ...');
    await sql.unsafe(extSql);
    console.log('[migrate] Extensions created.');

    // Step 2: Run drizzle-kit managed migrations (creates tables, indexes, FKs)
    console.log('[migrate] Running drizzle-kit migrations ...');
    await migrate(db, { migrationsFolder: join(__dirname, 'migrations') });
    console.log('[migrate] Drizzle migrations complete.');

    // Step 3: Run RLS policies (must come after tables exist)
    for (const file of manualMigrations.slice(1)) {
      const filePath = join(__dirname, 'migrations', file);
      const content = readFileSync(filePath, 'utf-8');
      console.log('[migrate] Running', file, '...');
      // Split on semicolons and run each statement individually.
      // Strip SQL comment lines from each block, then filter out empty blocks.
      const statements = content
        .split(';')
        .map((s) =>
          s
            .split('\n')
            .filter((line) => !line.trimStart().startsWith('--'))
            .join('\n')
            .trim(),
        )
        .filter((s) => s.length > 0);
      for (const stmt of statements) {
        await sql.unsafe(stmt);
      }
      console.log('[migrate]', file, 'complete.');
    }

    console.log('[migrate] All migrations completed successfully.');
  } catch (err) {
    console.error('[migrate] Migration failed:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
