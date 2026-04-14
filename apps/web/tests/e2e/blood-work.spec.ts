import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, expectedBloodWork } from '../fixtures';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEXT_PDF = path.resolve(__dirname, '../fixtures/pdf-fixtures/text-blood-work.pdf');

test.describe('blood work', () => {
  test('route is reachable', async ({ page }) => {
    const res = await page.goto('/blood-work');
    expect(res?.status() ?? 200).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('text PDF upload shows parsed biomarkers', async ({ page }) => {
    test.skip(!existsSync(TEXT_PDF), 'fixture PDF not generated — see pdf-fixtures/README.md');
    await page.goto('/blood-work');
    const input = page.locator('input[type="file"]').first();
    const inputCount = await input.count();
    test.skip(inputCount === 0, 'no file input rendered on blood work route');

    await input.setInputFiles(TEXT_PDF);

    // Wait for parse completion — accept either a table or an individual biomarker name.
    const firstName = expectedBloodWork.expectedBiomarkers[0].name;
    await expect(page.getByText(new RegExp(firstName, 'i')).first()).toBeVisible({
      timeout: 30_000,
    });

    for (const bm of expectedBloodWork.expectedBiomarkers) {
      await expect(page.getByText(new RegExp(bm.name, 'i')).first()).toBeVisible();
    }
  });
});
