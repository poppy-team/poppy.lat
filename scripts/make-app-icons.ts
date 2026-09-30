/**
 * Draws the icons of the installed app from the favicon: the logo on the
 * paper colour of the site. The "any" icons leave a little air around the
 * logo; the maskable one keeps it inside the central 60%, the zone that every
 * launcher shape (circle, squircle, square) shows.
 *
 *   node --experimental-strip-types scripts/make-app-icons.ts
 *
 * Needs a Chromium; the path comes from PLAYWRIGHT_CHROMIUM or the one the
 * sandbox ships. The PNGs are committed, so this only runs when the logo changes.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const root = path.resolve(import.meta.dirname, '..');
const svg = readFileSync(path.join(root, 'site/public/favicon.svg'), 'utf8');
const paper = '#f1eddf';

const icons = [
  { file: 'app-icon-192.png', size: 192, logo: 0.78 },
  { file: 'app-icon-512.png', size: 512, logo: 0.78 },
  { file: 'app-icon-maskable-512.png', size: 512, logo: 0.56 },
];

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium',
});

for (const { file, size, logo } of icons) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  const inner = Math.round(size * logo);

  await page.setContent(
    `<style>html,body{margin:0;height:100%;background:${paper};display:grid;place-items:center}` +
      `svg{width:${inner}px;height:${inner}px}</style>${svg.replace(/<\?xml[^>]*\?>/u, '')}`,
  );
  writeFileSync(path.join(root, 'site/public/assets', file), await page.screenshot({ type: 'png' }));
  await page.close();
}

await browser.close();
