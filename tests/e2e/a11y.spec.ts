import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { expect, test, type Page } from '@playwright/test';

/**
 * Automated accessibility check with axe-core, on one page of every kind, in
 * both themes and on a phone. It finds what a tool can find (contrast, names,
 * landmarks, roles); keyboard and screen reader use still need people. The
 * rule set is WCAG 2.0 to 2.2 level A and AA plus axe's best practices.
 */
const axeSource = readFileSync(createRequire(import.meta.url).resolve('axe-core'), 'utf8');

const pages = [
  '/',
  '/en/',
  '/projects/ori/',
  '/blog/',
  '/blog/um-arquivo-com-origem',
  '/aprender/',
  '/aprender/pensar-em-codigo/primeiro-programa/ola',
  '/aprender/regras',
  '/en/learn/',
  '/conta/entrar',
  '/ori/docs/',
  '/aipo/docs/guides/getting-started/first-program',
  '/not-found/',
];

async function violations(page: Page): Promise<string[]> {
  await page.addScriptTag({ content: axeSource });

  return page.evaluate(async () => {
    const axe = (window as unknown as { axe: { run: (context: Document, options: object) => Promise<{ violations: { id: string; nodes: { target: string[] }[] }[] }> } }).axe;
    const result = await axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
    });

    return result.violations.flatMap((violation) => violation.nodes.map((node) => `${violation.id}: ${node.target.join(' ')}`));
  });
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`acessibilidade (axe), tema ${scheme}`, () => {
    test.use({ colorScheme: scheme });

    for (const path of pages) {
      test(`${path} nao tem violacoes`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState('load');
        await page.waitForTimeout(500);

        expect(await violations(page)).toEqual([]);
      });
    }
  });
}

test.describe('acessibilidade (axe), celular', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  for (const path of ['/', '/aprender/', '/aprender/pensar-em-codigo/primeiro-programa/ola', '/ori/docs/']) {
    test(`${path} nao tem violacoes`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('load');
      await page.waitForTimeout(500);

      expect(await violations(page)).toEqual([]);
    });
  }
});
