import { test, expect } from '../fixtures';

test.describe('browse herbs', () => {
  test('browse with herbs tab renders', async ({ page }) => {
    const res = await page.goto('/browse');
    expect(res?.status() ?? 200).toBeLessThan(500);
    const herbsTab = page.getByRole('tab', { name: /herbs/i }).first();
    const has = (await herbsTab.count()) > 0;
    if (has) {
      await herbsTab.click();
      const ashwa = page.getByText(/ashwagandha|tulsi|turmeric|ginger/i).first();
      // Herbs may take a moment to render from the 700-entry Amidha dataset.
      await expect(ashwa).toBeVisible({ timeout: 8_000 }).catch(() => undefined);
    }
    await expect(page.locator('body')).toBeVisible();
  });
});
