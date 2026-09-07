import { test, expect } from '@playwright/test';

test.describe('catalog 305', () => {
  test('renders 20 items after JS runs', async ({ page }) => {
    await page.goto('/catalog/305');
    await expect(page.locator('#status')).toHaveText('ready');
    await expect(page.locator('.item')).toHaveCount(20);
  });

  test('prices are numbers above zero', async ({ page }) => {
    await page.goto('/catalog/305');
    await expect(page.locator('#status')).toHaveText('ready');
    const prices = await page.locator('.item').evaluateAll((els) =>
      els.map((el) => Number((el as HTMLElement).dataset.price)),
    );
    expect(prices.every((p) => p > 0)).toBe(true);
  });

  test('title matches the catalog id', async ({ page }) => {
    await page.goto('/catalog/305');
    await expect(page).toHaveTitle('Catalog 305');
    await expect(page.locator('h1')).toHaveText('Catalog 305');
  });
});
