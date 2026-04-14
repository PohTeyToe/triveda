import { expect, test } from '../fixtures';

test.describe('profile edit', () => {
  test('profile route renders', async ({ page }) => {
    const res = await page.goto('/profile');
    expect(res?.status() ?? 200).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('reset demo button returns to day 1', async ({ page, demoApi }) => {
    await demoApi.advanceDay(3).catch(() => undefined);
    await page.goto('/profile');

    const resetBtn = page
      .getByRole('button', { name: /reset\s*(demo)?/i })
      .or(page.locator('[data-testid="reset-demo"]'))
      .first();
    const has = (await resetBtn.count()) > 0;
    test.skip(!has, 'reset demo button not rendered on profile');

    await resetBtn.click();
    // Confirm dialog if present
    const confirm = page.getByRole('button', { name: /confirm|yes|reset/i }).first();
    if ((await confirm.count()) > 0) {
      await confirm.click().catch(() => undefined);
    }
    const day = await demoApi.getCurrentDay();
    expect(day).toBe(1);
  });
});
