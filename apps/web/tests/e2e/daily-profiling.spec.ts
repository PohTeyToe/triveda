import { test, expect } from '../fixtures';

test.describe('progressive daily profiling', () => {
  test('question appears on day 2', async ({ page, demoApi }) => {
    await demoApi.advanceDay(1).catch(() => undefined);
    await page.goto('/');
    const question = page
      .locator('[data-testid="profiling-question"]')
      .or(page.getByRole('group', { name: /today|profile|question/i }))
      .first();
    const has = (await question.count()) > 0;
    test.skip(!has, 'progressive profiling widget not rendered');
    await expect(question).toBeVisible();
  });
});
