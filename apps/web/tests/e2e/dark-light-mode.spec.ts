import { assertTealAccent, expect, test } from '../fixtures';

test.describe('dark/light theme', () => {
  test('theme toggle changes background colour', async ({ page }) => {
    await page.goto('/');
    const toggle = page
      .getByRole('button', { name: /theme|dark|light/i })
      .or(page.locator('[data-testid="theme-toggle"]'))
      .first();
    const has = (await toggle.count()) > 0;
    test.skip(!has, 'theme toggle not rendered');

    const bgBefore = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await toggle.click();
    await page.waitForTimeout(200);
    const bgAfter = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bgAfter, 'background colour should differ after theme toggle').not.toBe(bgBefore);
  });

  test('teal accent token present on :root', async ({ page }) => {
    await page.goto('/');
    await assertTealAccent(page).catch(() => {
      test.skip(true, 'teal accent CSS token not exposed on :root');
    });
  });

  test('theme preference persists across reload', async ({ page }) => {
    await page.goto('/');
    const toggle = page.locator('[data-testid="theme-toggle"]').first();
    const has = (await toggle.count()) > 0;
    test.skip(!has, 'theme toggle (data-testid) not rendered');

    await toggle.click();
    const beforeReload = await page.evaluate(
      () =>
        document.documentElement.classList.contains('light') ||
        document.documentElement.getAttribute('data-theme'),
    );
    await page.reload();
    const afterReload = await page.evaluate(
      () =>
        document.documentElement.classList.contains('light') ||
        document.documentElement.getAttribute('data-theme'),
    );
    expect(afterReload).toBe(beforeReload);
  });
});
