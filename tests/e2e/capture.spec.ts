import { test } from '@playwright/test';

/**
 * Captures screenshots of the published site for visual review.
 * Run with: npx playwright test --grep @capture
 */

const routes = [
  { name: 'home-pt', path: '/' },
  { name: 'home-en', path: '/en/' },
  { name: 'project-ori', path: '/projects/ori' },
  { name: 'docs-ori', path: '/ori/docs/' },
  { name: 'docs-oride', path: '/oride/docs/' },
  { name: 'docs-prumo', path: '/prumo/docs/' },
  { name: 'aipo-landing', path: '/aipo/docs/' },
  { name: 'aipo-manual', path: '/aipo/docs/guides/manual/syntax-and-types/' },
  { name: 'not-found', path: '/not-found/' },
];

test.describe('screenshots @capture', () => {
  for (const viewport of [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
  ]) {
    for (const theme of ['light', 'dark']) {
      for (const route of routes) {
        test(`${route.name}-${viewport.name}-${theme}`, async ({ page }) => {
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await page.goto(route.path);
          await page.evaluate((mode) => {
            document.documentElement.classList.toggle('dark', mode === 'dark');
          }, theme);
          await page.waitForLoadState('networkidle');

          await page.screenshot({
            path: `screenshots/${route.name}-${viewport.name}-${theme}.png`,
            fullPage: true,
          });
        });
      }
    }
  }
});
