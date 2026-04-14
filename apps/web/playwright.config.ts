import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for the Triveda E2E + visual regression suite.
 *
 * Modes:
 *   - Production (default): `E2E_BASE_URL` defaults to the production Vercel URL
 *     and no dev servers are started.
 *   - Local: set `E2E_LOCAL=1` to boot two local dev servers (demo mode on 3001
 *     and guest mode on 3000) and point the base URL at the demo server.
 *   - Override: set `E2E_BASE_URL=https://...` explicitly to target any deploy.
 *
 * Four browser projects cover mobile + desktop. SSE-heavy specs may call
 * `test.slow()` to raise timeouts.
 *
 * Secrets: none (the app self-authenticates in demo mode).
 */

const DEFAULT_BASE_URL = 'https://triveda-kappa.vercel.app';
const BASE_URL = process.env.E2E_BASE_URL ?? DEFAULT_BASE_URL;
const USE_LOCAL = process.env.E2E_LOCAL === '1' || process.env.E2E_LOCAL === 'true';
const LOCAL_DEMO_PORT = 3001;
const LOCAL_GUEST_PORT = 3000;
const LOCAL_DEMO_URL = `http://localhost:${LOCAL_DEMO_PORT}`;

export default defineConfig({
  testDir: './tests',
  testMatch: ['e2e/**/*.spec.ts', 'visual/**/*.spec.ts'],
  // Legacy single-file spec still at apps/web/e2e/core-flows.spec.ts
  // gets picked up via the additional glob below.
  globalSetup: './tests/global-setup.ts',
  outputDir: './test-results',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [
        ['list'],
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
      ]
    : [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: USE_LOCAL ? LOCAL_DEMO_URL : BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14 Pro'] } },
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
    },
    {
      name: 'desktop-firefox',
      use: { ...devices['Desktop Firefox'], viewport: { width: 1280, height: 720 } },
    },
  ],
  webServer: USE_LOCAL
    ? [
        {
          command: 'pnpm --filter @triveda/web dev -- --port 3001',
          port: LOCAL_DEMO_PORT,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          env: {
            VITE_DEMO_MODE: 'true',
            VITE_ENABLE_DEMO_MODE: 'true',
            VITE_SUPABASE_URL: '',
            VITE_SUPABASE_ANON_KEY: '',
          },
        },
        {
          command: 'pnpm --filter @triveda/web dev -- --port 3000',
          port: LOCAL_GUEST_PORT,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      ]
    : undefined,
});
