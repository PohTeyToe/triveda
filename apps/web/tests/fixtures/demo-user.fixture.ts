import { type Page, test as base, expect } from '@playwright/test';

/**
 * Demo user fixture: provides `demoPage` (authenticated page rooted at `/`)
 * and `demoApi` (direct API helpers that bypass the UI).
 *
 * Auto-resets demo state in `beforeEach` so each test starts fresh.
 */

export interface CheckInAnswer {
  mood: string;
  energy: string;
  digestion: string;
}

export interface DemoApi {
  resetState(): Promise<void>;
  advanceDay(count?: number): Promise<number>;
  jumpToDay(day: number): Promise<void>;
  submitCheckIn(answers: CheckInAnswer): Promise<void>;
  submitFeedback(foodId: string, response: 'tried' | 'rejected'): Promise<void>;
  getCurrentDay(): Promise<number>;
}

interface DemoFixtures {
  demoPage: Page;
  demoApi: DemoApi;
}

function resolveApiBase(): string {
  return (
    process.env.VITE_API_URL ??
    process.env.API_URL ??
    process.env.E2E_API_URL ??
    'https://triveda-api-production.up.railway.app'
  );
}

function buildDemoApi(): DemoApi {
  const base = resolveApiBase();

  async function post<T = unknown>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      throw new Error(`POST ${path} failed: ${res.status} ${await res.text()}`);
    }
    return (await res.json().catch(() => ({}))) as T;
  }

  async function get<T = unknown>(path: string): Promise<T> {
    const res = await fetch(`${base}${path}`);
    if (!res.ok) {
      throw new Error(`GET ${path} failed: ${res.status} ${await res.text()}`);
    }
    return (await res.json()) as T;
  }

  return {
    async resetState() {
      try {
        await post('/demo-state/reset');
      } catch {
        // Soft-fail: if the endpoint isn't reachable we proceed so tests can
        // surface the real failure at the assertion layer.
      }
    },
    async advanceDay(count = 1) {
      let currentDay = 0;
      for (let i = 0; i < count; i++) {
        const res = await post<{ current_day?: number; currentDay?: number }>(
          '/demo-state/advance',
        );
        currentDay = res.current_day ?? res.currentDay ?? currentDay + 1;
      }
      return currentDay;
    },
    async jumpToDay(day: number) {
      await this.resetState();
      if (day > 1) {
        await this.advanceDay(day - 1);
      }
    },
    async submitCheckIn(answers) {
      await post('/daily-check-in', answers);
    },
    async submitFeedback(foodId, response) {
      await post('/food-feedback', { foodId, response });
    },
    async getCurrentDay() {
      try {
        const res = await get<{ current_day?: number; currentDay?: number }>('/demo-state');
        return res.current_day ?? res.currentDay ?? 1;
      } catch {
        return 1;
      }
    },
  };
}

export const test = base.extend<DemoFixtures>({
  // biome-ignore lint/correctness/noEmptyPattern: Playwright fixture signature requires destructured arg
  demoApi: async ({}, use) => {
    const api = buildDemoApi();
    await api.resetState();
    await use(api);
  },
  demoPage: async ({ page, demoApi: _demoApi }, use) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    await use(page);
  },
});

export { expect };
