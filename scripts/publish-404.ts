/**
 * Copies the rendered not-found page over dist/404.html.
 *
 * VitePress reserves 404.md for its own shell and does not prerender that
 * page's body, so the branded not-found page is authored at /not-found/ and
 * published as the static 404 document here.
 */

import { copyFile, stat } from 'node:fs/promises';
import path from 'node:path';

const distRoot = 'site/.vitepress/dist';
const source = path.join(distRoot, 'not-found', 'index.html');
const destination = path.join(distRoot, '404.html');

try {
  await stat(source);
  await copyFile(source, destination);
  console.log('404.html <- not-found/index.html');
} catch (error) {
  console.error('Could not publish 404.html:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
