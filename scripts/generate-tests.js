// Generates N spec files with 3 tests each. Playwright shards by file,
// so a suite with more files than shards is needed for even splits.
// Usage: node scripts/generate-tests.js [files] [dir]
//   node scripts/generate-tests.js 48                 -> tests/ (144 tests)
//   node scripts/generate-tests.js 480 tests-large    -> tests-large/ (1,440 tests)
const fs = require('fs');
const path = require('path');

const files = Number(process.argv[2] || 48);
const dir = path.join(__dirname, '..', process.argv[3] || 'tests');
fs.mkdirSync(dir, { recursive: true });

for (let i = 1; i <= files; i++) {
  const src = `import { test, expect } from '@playwright/test';

test.describe('catalog ${i}', () => {
  test('renders 20 items after JS runs', async ({ page }) => {
    await page.goto('/catalog/${i}');
    await expect(page.locator('#status')).toHaveText('ready');
    await expect(page.locator('.item')).toHaveCount(20);
  });

  test('prices are numbers above zero', async ({ page }) => {
    await page.goto('/catalog/${i}');
    await expect(page.locator('#status')).toHaveText('ready');
    const prices = await page.locator('.item').evaluateAll((els) =>
      els.map((el) => Number((el as HTMLElement).dataset.price)),
    );
    expect(prices.every((p) => p > 0)).toBe(true);
  });

  test('title matches the catalog id', async ({ page }) => {
    await page.goto('/catalog/${i}');
    await expect(page).toHaveTitle('Catalog ${i}');
    await expect(page.locator('h1')).toHaveText('Catalog ${i}');
  });
});
`;
  fs.writeFileSync(path.join(dir, `catalog-${String(i).padStart(3, '0')}.spec.ts`), src);
}
console.log(`wrote ${files} spec files to ${dir}`);
