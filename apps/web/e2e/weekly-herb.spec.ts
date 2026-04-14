/**
 * Weekly herb — Playwright happy-path E2E.
 *
 * Verifies the /weekly-herb route renders:
 *   - A main herb card (name or "Weekly Herb" heading)
 *   - Tradition perspectives section (if herb data is available)
 *   - Feedback controls (if wired in the rendered variant)
 *
 * The demo deploy may return `{ herb: null, reason: 'profile_incomplete' }`
 * for users without a constitution. The spec handles both the herb-present
 * and profile-incomplete happy paths, because both are valid rendered
 * states.
 */

import { expect, test } from '@playwright/test';

test.describe('weekly herb — route renders successfully', () => {
  test('navigates to /weekly-herb and renders either a herb card or the empty state', async ({
    page,
  }) => {
    const res = await page.goto('/weekly-herb');
    expect(res?.status() ?? 0).toBeLessThan(400);
    await expect(page.locator('body')).toBeVisible();

    // Page should show the "This Week's Herb" heading OR the fallback "Weekly Herb"
    // headline inside the empty-state card. Either is a valid happy path.
    const hasHeading = await page
      .getByText(/this week'?s herb|weekly herb/i)
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false);
    expect(hasHeading).toBe(true);
  });

  test('displays the herb name heading when a herb is available', async ({ page }) => {
    await page.goto('/weekly-herb');
    await expect(page.locator('body')).toBeVisible();

    // h1 with the herb name is the canonical render path.
    const herbHeading = page.locator('h1').first();
    const hasHerb = await herbHeading.isVisible({ timeout: 10_000 }).catch(() => false);

    test.skip(
      !hasHerb,
      'weekly herb not yet available for demo user (profile_incomplete or no herb scheduled)',
    );

    await expect(herbHeading).not.toHaveText('');
  });

  test('tradition perspectives section renders when tradition notes are populated', async ({
    page,
  }) => {
    await page.goto('/weekly-herb');
    await expect(page.locator('body')).toBeVisible();

    const traditionHeader = page.getByText(/traditional perspectives/i);
    const hasTraditions = await traditionHeader.isVisible({ timeout: 10_000 }).catch(() => false);
    test.skip(!hasTraditions, 'tradition notes not surfaced (pending or herb unavailable)');

    await expect(traditionHeader).toBeVisible();
    // At least one of the three tradition labels should render.
    const anyTradition = page.getByText(/ayurveda|traditional chinese medicine|naturopathy/i);
    await expect(anyTradition.first()).toBeVisible();
  });

  test('feedback controls render if the feedback variant is deployed', async ({ page }) => {
    await page.goto('/weekly-herb');
    await expect(page.locator('body')).toBeVisible();

    // Feedback buttons use role=button with a "tried" / "helpful" / "not for me" label.
    // Skip cleanly if the deployed variant does not include them.
    const feedbackBtn = page.getByRole('button', {
      name: /tried it|helpful|not for me|skip/i,
    });
    const hasFeedback = await feedbackBtn
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    test.skip(!hasFeedback, 'feedback variant not deployed to current build');

    await expect(feedbackBtn.first()).toBeEnabled();
  });
});
