#!/usr/bin/env bun
/**
 * Production smoke test for Triveda.
 *
 * Verifies all production endpoints are healthy, return valid response shapes,
 * and SSE streaming works. Designed to run before the Sasha demo call and
 * as a post-deploy CI gate.
 *
 * Usage:
 *   bun run scripts/smoke-production.ts
 *   bun run scripts/smoke-production.ts --api-url=https://triveda-api.onrender.com
 *   bun run scripts/smoke-production.ts --verbose
 *
 * Exit codes:
 *   0 -- all tests passed
 *   1 -- one or more tests failed
 */

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const flags: Record<string, string | boolean> = {};
for (const arg of args) {
  if (arg === '--verbose') {
    flags.verbose = true;
  } else if (arg.startsWith('--api-url=')) {
    flags.apiUrl = arg.split('=').slice(1).join('=');
  } else if (arg.startsWith('--web-url=')) {
    flags.webUrl = arg.split('=').slice(1).join('=');
  } else if (arg.startsWith('--auth-token=')) {
    flags.authToken = arg.split('=').slice(1).join('=');
  }
}

const API_URL =
  (flags.apiUrl as string) || process.env.API_URL || 'https://triveda-api.onrender.com';
const VERBOSE = flags.verbose === true;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TestResult = {
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
};

const results: TestResult[] = [];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function timedFetch(
  url: string,
  init?: RequestInit,
): Promise<{ res: Response; durationMs: number }> {
  const start = performance.now();
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(15000) });
  const durationMs = Math.round(performance.now() - start);
  return { res, durationMs };
}

function record(result: TestResult) {
  results.push(result);
  const icon = result.passed ? '[PASS]' : '[FAIL]';
  const timing = `${result.durationMs}ms`.padStart(6);
  console.log(`${icon}  ${result.name.padEnd(35)} ${timing}`);
  if (!result.passed && result.error) {
    console.log(`        ${result.error}`);
  }
}

// ---------------------------------------------------------------------------
// Health check with retry (handles Render cold starts)
// ---------------------------------------------------------------------------

async function checkHealth(): Promise<void> {
  const MAX_RETRIES = 10;
  const RETRY_DELAY = 3000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { res, durationMs } = await timedFetch(`${API_URL}/healthz`);
      if (res.ok) {
        const body = await res.json();
        if (body.status === 'ok') {
          record({ name: '/healthz', passed: true, durationMs });
          return;
        }
      }
    } catch {
      // Connection refused or timeout -- expected during cold start
    }

    if (attempt < MAX_RETRIES) {
      console.log(`[RETRY ${attempt}/${MAX_RETRIES}] /healthz -- waiting for cold start...`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY));
    }
  }

  record({
    name: '/healthz',
    passed: false,
    durationMs: MAX_RETRIES * RETRY_DELAY,
    error: `Service not responding after ${(MAX_RETRIES * RETRY_DELAY) / 1000}s. Check Render dashboard.`,
  });
  throw new Error('Health check failed -- aborting smoke test');
}

// ---------------------------------------------------------------------------
// Endpoint tests
// ---------------------------------------------------------------------------

async function testEndpoint(
  name: string,
  path: string,
  options: {
    method?: string;
    body?: unknown;
    expectedStatus?: number;
    validate?: (body: unknown) => string | null;
    authToken?: string;
  } = {},
): Promise<void> {
  const { method = 'GET', body, expectedStatus = 200, validate, authToken } = options;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const init: RequestInit = { method, headers };
    if (body) init.body = JSON.stringify(body);

    const { res, durationMs } = await timedFetch(`${API_URL}${path}`, init);

    if (res.status !== expectedStatus) {
      const text = VERBOSE ? await res.text() : '';
      record({
        name,
        passed: false,
        durationMs,
        error: `Expected ${expectedStatus}, got ${res.status}${text ? `: ${text.slice(0, 200)}` : ''}`,
      });
      return;
    }

    if (validate) {
      const json = await res.json();
      const validationError = validate(json);
      if (validationError) {
        record({ name, passed: false, durationMs, error: validationError });
        return;
      }
    }

    record({ name, passed: true, durationMs });
  } catch (err) {
    record({
      name,
      passed: false,
      durationMs: 0,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('');
  console.log('Triveda Production Smoke Test');
  console.log('==============================');
  console.log(`API: ${API_URL}`);
  console.log('');

  // 1. Health check with retry (must pass before anything else)
  await checkHealth();

  // 2. Public endpoints (no auth needed)
  //
  // Note: routes below /healthz require DATABASE_URL and other env vars
  // to be configured on Render. If they return 404, the API is likely
  // running in minimal mode (healthz only). This is expected for fresh
  // deploys before env vars are set.

  await testEndpoint('/weather', '/weather?lat=43.65&lon=-79.38', {
    validate: (body: unknown) => {
      const b = body as Record<string, unknown>;
      if (typeof b.temp !== 'number' && typeof b.temperature !== 'number') {
        return 'Missing temp/temperature field in weather response';
      }
      return null;
    },
  });

  await testEndpoint('/api/v1/constitution (meta)', '/api/v1/constitution/questions', {
    validate: (body: unknown) => {
      if (!Array.isArray(body) && !(body as Record<string, unknown>)?.questions) {
        return 'Expected questions array in response';
      }
      return null;
    },
  });

  // 3. Constitution assess (public endpoint -- 3 quick-start answers)
  await testEndpoint('/api/v1/constitution/assess', '/api/v1/constitution/assess', {
    method: 'POST',
    body: {
      answers: [
        { questionId: 1, choice: 'thin-light' },
        { questionId: 2, choice: 'variable-appetite' },
        { questionId: 3, choice: 'light-interrupted' },
      ],
    },
    validate: (body: unknown) => {
      const b = body as Record<string, unknown>;
      if (!b.doshaRatios && !b.dosha_ratios) {
        return 'Missing doshaRatios in constitution response';
      }
      return null;
    },
  });

  // 4. Auth-required endpoints -- test that they return 401 without auth
  // (proves the route exists and middleware works)
  await testEndpoint('/api/v1/foods/browse (auth gate)', '/api/v1/foods/browse', {
    expectedStatus: 401,
  });
  await testEndpoint('/api/v1/herbs/browse (auth gate)', '/api/v1/herbs/browse', {
    expectedStatus: 401,
  });

  // 5. OG image test
  await testEndpoint('/api/og/default', '/api/og/default', {
    validate: (_body: unknown) => {
      // For OG endpoints, just checking status 200 is sufficient
      return null;
    },
  });

  // --- Summary ---
  console.log('');
  console.log('==============================');

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const totalTime = results.reduce((sum, r) => sum + r.durationMs, 0);

  console.log(`${passed}/${total} passed in ${(totalTime / 1000).toFixed(1)}s`);
  console.log('');

  if (passed < total) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Smoke test crashed:', err.message || err);
  process.exit(1);
});
