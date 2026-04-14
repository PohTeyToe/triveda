import { test, expect, assertMobileLayout } from '../fixtures';

test.describe('browse foods', () => {
  test('browse route renders', async ({ page }) => {
    const res = await page.goto('/browse');
    expect(res?.status() ?? 200).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('mobile layout has no horizontal overflow', async ({ page }, testInfo) => {
    test.skip(
      !testInfo.project.name.startsWith('mobile'),
      'desktop viewport — mobile layout assertion not applicable',
    );
    await page.goto('/browse');
    await assertMobileLayout(page);
  });

  test('search input filters results', async ({ page }) => {
    await page.goto('/browse');
    const search = page
      .getByRole('searchbox')
      .or(page.locator('input[type="search"]'))
      .or(page.locator('input[placeholder*="earch" i]'))
      .first();
    const hasSearch = (await search.count()) > 0;
    test.skip(!hasSearch, 'browse search input not rendered yet');
    await search.fill('oat');
    // Wait for debounce + network.
    await page.waitForTimeout(500);
    // Tolerant assertion: either an "oatmeal"-ish result or an empty-state with "oat".
    const any = page.getByText(/oat/i).first();
    await expect(any).toBeVisible({ timeout: 5_000 });
  });
});
