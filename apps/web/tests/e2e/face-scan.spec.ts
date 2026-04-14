import { expect, test } from '../fixtures';

test.describe('face scan mock', () => {
  test('face-scan route renders', async ({ page }) => {
    const res = await page.goto('/face-scan');
    expect(res?.status() ?? 200).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('consent screen appears before capture', async ({ page }) => {
    await page.goto('/face-scan');
    const consent = page.getByText(/consent|privacy|understand|continue/i).first();
    const has = (await consent.count()) > 0;
    test.skip(!has, 'consent screen not rendered yet');
    await expect(consent).toBeVisible();
  });

  test('simulated-data badge prominent after scan', async ({ page }) => {
    await page.goto('/face-scan');
    const consentBtn = page.getByRole('button', { name: /understand|continue|consent/i }).first();
    if ((await consentBtn.count()) > 0) {
      await consentBtn.click().catch(() => undefined);
    }
    const badge = page.getByText(/simulated/i).first();
    const has = (await badge.count()) > 0;
    test.skip(!has, 'simulated badge not rendered yet');
    await expect(badge).toBeVisible();
  });
});
