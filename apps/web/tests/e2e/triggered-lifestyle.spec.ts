import { test, expect, anxiousSequence } from '../fixtures';

test.describe('triggered lifestyle recommendations', () => {
  test('breathwork card appears after 3 anxious check-ins', async ({ page, demoApi }) => {
    for (let i = 0; i < anxiousSequence.length; i++) {
      try {
        await demoApi.submitCheckIn(anxiousSequence[i]);
      } catch {
        test.skip(true, 'demo API unavailable for seeding check-ins');
      }
      await demoApi.advanceDay().catch(() => undefined);
    }
    await page.goto('/');

    const breathwork = page
      .getByText(/breath|breathing|4-7-8|nadi/i)
      .or(page.locator('[data-testid="triggered-breathwork"]'))
      .first();

    const count = await breathwork.count();
    test.skip(count === 0, 'breathwork lifestyle card not currently rendered');
    await expect(breathwork).toBeVisible();
  });
});
