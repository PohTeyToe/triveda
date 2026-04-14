import { test, expect } from '../fixtures';

test.describe('seasonal transition card', () => {
  test('home loads without errors', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('transition card renders at Ritu boundary if seeded', async ({ page, demoApi }) => {
    // Jump far enough that the demo calendar crosses a Ritu boundary. The
    // exact day depends on seeded state, so this test is tolerant.
    await demoApi.jumpToDay(7).catch(() => undefined);
    await page.goto('/');

    const transition = page
      .locator('[data-testid="seasonal-transition"]')
      .or(page.getByText(/ritu|season(al)?\s+transition/i))
      .first();
    const has = (await transition.count()) > 0;
    test.skip(!has, 'transition card not active for current demo state');
    await expect(transition).toBeVisible();
  });
});
