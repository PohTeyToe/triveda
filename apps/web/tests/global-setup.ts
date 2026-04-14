import type { FullConfig } from '@playwright/test';

/**
 * Global setup: runs once before the entire Playwright suite.
 *
 * Verifies the target base URL responds before tests start. When running against
 * local demo mode (E2E_LOCAL=1), also attempts to reset the API demo state so
 * every suite run begins from Day 1.
 */
export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use?.baseURL ?? process.env.E2E_BASE_URL;
  if (!baseURL) {
    throw new Error('globalSetup: no baseURL resolved (set E2E_BASE_URL or E2E_LOCAL=1)');
  }

  // Probe the base URL — three attempts with backoff so a slow dev server
  // doesn't fail the run on first poll.
  const attempts = 3;
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(baseURL, { method: 'HEAD' });
      if (res.status < 500) {
        // 2xx/3xx/4xx all acceptable — we only care that the origin answered.
        break;
      }
      lastError = new Error(`status ${res.status}`);
    } catch (err) {
      lastError = err;
    }
    if (i < attempts - 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  if (lastError && attempts > 0) {
    // Not fatal — tests themselves will fail loudly if the origin is down, but
    // we log so CI captures the context.
    console.warn(`[globalSetup] base URL probe warning: ${String(lastError)}`);
  }

  // Best-effort demo state reset. API URL is derived from VITE_API_URL or falls
  // back to a reasonable default. Failure here is non-fatal.
  const apiUrl =
    process.env.VITE_API_URL ??
    process.env.API_URL ??
    (process.env.E2E_LOCAL === '1' ? 'http://localhost:3000' : null);
  if (apiUrl) {
    try {
      await fetch(`${apiUrl}/demo-state/reset`, { method: 'POST' });
    } catch {
      // intentional: demo reset is a soft guarantee
    }
  }
}
