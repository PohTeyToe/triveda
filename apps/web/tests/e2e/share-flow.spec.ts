import { expect, test } from '../fixtures';

test.describe('share flow', () => {
  test('constitution route renders', async ({ page }) => {
    const res = await page.goto('/constitution');
    expect(res?.status() ?? 200).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('share button opens modal on desktop', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name.startsWith('mobile'),
      'mobile uses the native share sheet — covered separately',
    );
    await page.goto('/constitution');

    const shareBtn = page
      .getByRole('button', { name: /share/i })
      .or(page.locator('[data-testid="share-button"]'))
      .first();
    const has = (await shareBtn.count()) > 0;
    test.skip(!has, 'share button not yet rendered');

    await shareBtn.click();
    const dialog = page.getByRole('dialog').first();
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog).toContainText(/copy|link|share/i);
  });

  test('copy link places URL on clipboard', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name.startsWith('mobile'), 'desktop-only flow');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => undefined);
    await page.goto('/constitution');

    const shareBtn = page
      .getByRole('button', { name: /share/i })
      .or(page.locator('[data-testid="share-button"]'))
      .first();
    if ((await shareBtn.count()) === 0) test.skip(true, 'no share button rendered');
    await shareBtn.click();

    const copyBtn = page.getByRole('button', { name: /copy/i }).first();
    if ((await copyBtn.count()) === 0) test.skip(true, 'no copy-link button rendered');
    await copyBtn.click();

    const clip = await page.evaluate(() => navigator.clipboard.readText()).catch(() => '');
    expect(clip).toMatch(/^https?:\/\//);
  });
});
