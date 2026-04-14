import { expect, test } from '../fixtures';

/**
 * Visual regression baselines for the core screens.
 *
 * Runs only on the desktop-chrome project by default (filtered in the command
 * `test:visual`). Update baselines with `pnpm --filter @triveda/web test:visual:update`.
 *
 * Each screen is captured with animations disabled and a 1% pixel tolerance
 * to absorb minor font-rendering drift between platforms.
 */

const screens: Array<{
  name: string;
  path: string;
}> = [
  { name: 'welcome', path: '/welcome' },
  { name: 'quick-start', path: '/quick-start' },
  { name: 'home', path: '/' },
  { name: 'constitution', path: '/constitution' },
  { name: 'profile', path: '/profile' },
  { name: 'settings', path: '/settings' },
  { name: 'browse', path: '/browse' },
  { name: 'face-scan', path: '/face-scan' },
  { name: 'weekly-herb', path: '/weekly-herb' },
];

for (const screen of screens) {
  test(`${screen.name} baseline`, async ({ page }, testInfo) => {
    await page.goto(screen.path);
    await page.waitForLoadState('domcontentloaded');
    // Soft settle for PWA shell + SSE.
    await page.waitForTimeout(500);

    const suffix = testInfo.project.name;
    await expect(page).toHaveScreenshot(`${screen.name}-${suffix}.png`, {
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
      fullPage: false,
    });
  });
}
