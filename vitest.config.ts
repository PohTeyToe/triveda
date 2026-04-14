import { defineConfig } from 'vitest/config';

/**
 * Root Vitest configuration for the Triveda monorepo.
 *
 * Uses the v3 `projects` feature to discover every workspace package that
 * ships its own vitest.config.ts. Coverage is merged across all projects.
 *
 * apps/api is intentionally excluded — it runs on Bun and uses `bun test`.
 */
export default defineConfig({
  test: {
    projects: [
      'packages/shared',
      'packages/db',
      'apps/web',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['json-summary', 'html', 'text'],
      reportsDirectory: './coverage',
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.config.{ts,js}',
        '**/*.d.ts',
        '**/tests/**',
        '**/*.test.{ts,tsx}',
        '**/__tests__/**',
        '**/routeTree.gen.ts',
      ],
    },
    bail: process.env.CI ? 1 : 0,
  },
});
