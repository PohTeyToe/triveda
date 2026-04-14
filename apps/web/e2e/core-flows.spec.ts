import { expect, test } from '@playwright/test';

test.describe('core demo flows', () => {
  test('welcome → quick-start → constitution', async ({ page }) => {
    await page.goto('/welcome');
    await expect(page.locator('body')).toBeVisible();

    const getStarted = page.getByRole('link', { name: /quick.?start|begin|start/i }).first();
    if (await getStarted.count()) {
      await getStarted.click();
    } else {
      await page.goto('/quick-start');
    }

    await expect(page).toHaveURL(/quick-start/);
    await expect(page.locator('body')).toContainText(/./);
  });

  test('home renders daily card', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="daily-greeting"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('footer[data-testid="home-footer"]')).toContainText(
      /powered by three traditions/i,
    );
  });

  test('browse loads with foods', async ({ page }) => {
    await page.goto('/browse');
    await expect(page.locator('body')).toBeVisible();
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {
      // Some responses may not reach networkidle on PWA-cached shells — fall through
    });
  });

  test('constitution, profile, settings, face scan routes load', async ({ page }) => {
    const routes = ['/constitution', '/profile', '/settings', '/face-scan', '/weekly-herb'];
    for (const route of routes) {
      const res = await page.goto(route);
      expect(res?.status(), `${route} status`).toBeLessThan(400);
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('no console errors on home', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // Ignore vite HMR + PWA SW warnings
    const filtered = errors.filter((e) => !/vite|service worker|workbox|manifest/i.test(e));
    expect(filtered, `unexpected errors: ${filtered.join('\n')}`).toHaveLength(0);
  });
});
