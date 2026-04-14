import { type Page, expect } from '@playwright/test';

/**
 * Common page interaction helpers used across E2E specs.
 */

const DAILY_CARD_TIMEOUT = 15_000;
const CREDIT_ROW_TIMEOUT = 10_000;

export async function waitForDailyCard(page: Page): Promise<void> {
  // Prefer a stable testid if present, fall back to any h1 in the daily card.
  const byTestId = page.locator('[data-testid="daily-card-food"]').first();
  const byHeading = page.getByRole('heading', { level: 1 }).first();
  await Promise.race([
    byTestId.waitFor({ state: 'visible', timeout: DAILY_CARD_TIMEOUT }).catch(() => undefined),
    byHeading.waitFor({ state: 'visible', timeout: DAILY_CARD_TIMEOUT }),
  ]);
}

export async function waitForCreditRow(page: Page): Promise<void> {
  const row = page.locator('[data-testid="credit-row"]');
  await row.waitFor({ state: 'visible', timeout: CREDIT_ROW_TIMEOUT });
  const chips = page.locator('[data-testid="credit-chip"]');
  await expect
    .poll(async () => chips.count(), {
      timeout: CREDIT_ROW_TIMEOUT,
      message: 'expected 22 credit chips',
    })
    .toBe(22);
}

export async function expandWhyPanel(page: Page): Promise<void> {
  const button = page
    .getByRole('button', { name: /why\??/i })
    .or(page.locator('[data-testid="why-toggle"]'))
    .first();
  await button.click();
  const anyTradition = page
    .getByRole('heading', { name: /ayurveda|tcm|naturopathy/i })
    .first();
  await anyTradition.waitFor({ state: 'visible', timeout: 5_000 });
}

export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(path);
  // TanStack Router paths include client-side redirects; allow a tick.
  await expect.poll(() => page.url()).toMatch(new RegExp(`${path.replace('/', '\\/')}(/|$|\\?|#)`));
}

export async function assertMobileLayout(page: Page): Promise<void> {
  const overflowing = await page.evaluate(() => {
    const { scrollWidth, clientWidth } = document.documentElement;
    return scrollWidth - clientWidth > 1;
  });
  expect(overflowing, 'horizontal overflow on mobile layout').toBe(false);
}

export async function assertTealAccent(page: Page): Promise<void> {
  // Accept either the CSS custom property or an element using the teal accent class.
  const tealPresent = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const token =
      root.getPropertyValue('--color-accent-teal').trim() ||
      root.getPropertyValue('--accent-teal').trim() ||
      root.getPropertyValue('--color-primary').trim();
    return Boolean(token);
  });
  expect(tealPresent, 'expected teal accent token on :root').toBe(true);
}
