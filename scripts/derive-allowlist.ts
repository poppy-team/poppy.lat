/**
 * Derives the documentation allow-list from what each project already
 * publishes.
 *
 * The Aipo and Prumo repositories ship the VitePress config for their own
 * site, and that config carries a `srcExclude` list: the directories and files
 * the project's authors decided not to publish. That list is the curation
 * criterion, authored by the project rather than picked here.
 *
 * This reads the config, reports what the criterion yields, and compares it
 * with the current allow-list so a gap is visible instead of silent.
 *
 * Usage: node --experimental-strip-types scripts/derive-allowlist.ts <clone-dir>
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { vendoredDocs } from '../packages/project-data/src/documentation.ts';

const cloneRoot = process.argv[2];

if (!cloneRoot) {
  console.error('Usage: derive-allowlist.ts <clone-dir>');
  process.exit(1);
}

interface Project {
  slug: string;
  clone: string;
  configPath: string;
  docsRoot: string;
}

const projects: Project[] = [
  {
    slug: 'aipo',
    clone: 'aipo-lang',
    configPath: 'docs/.vitepress/config.mts',
    docsRoot: 'docs',
  },
  { slug: 'prumo', clone: 'prumo', configPath: 'docs/.vitepress/config.mts', docsRoot: 'docs' },
  { slug: 'oride', clone: 'oride', configPath: '', docsRoot: 'docs' },
];

function parseSrcExclude(source: string): string[] {
  const match = source.match(/srcExclude:\s*\[([\s\S]*?)\]/u);

  if (!match?.[1]) {
    return [];
  }

  return [...match[1].matchAll(/'([^']+)'/gu)].map((entry) => entry[1] ?? '');
}

/** Turn a directory glob into a matcher over a repo-relative path. */
function excludedBy(patterns: string[], relativePath: string): boolean {
  return patterns.some((pattern) => {
    // A whole-directory exclusion.
    const directory = pattern.replace(/^\*\*\//u, '').replace(/\/\*\*$/u, '');
    if (!pattern.includes('*.md') && relativePath.includes(`/${directory}/`)) {
      return true;
    }

    // A single-file exclusion, matched by name.
    if (pattern.endsWith('.md')) {
      return relativePath.endsWith(`/${pattern.split('/').pop()}`);
    }

    return false;
  });
}

async function collectMarkdown(
  directory: string,
  base: string,
  patterns: string[],
): Promise<string[]> {
  const { readdir } = await import('node:fs/promises');
  const kept: string[] = [];

  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return kept;
  }

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      // The English tree is excluded from this pass; it is reported separately.
      if (entry.name === 'en') {
        continue;
      }

      kept.push(...(await collectMarkdown(entryPath, base, patterns)));
      continue;
    }

    if (!entry.name.endsWith('.md')) {
      continue;
    }

    const relative = path.relative(base, entryPath).split(path.sep).join('/');

    if (relative === 'index.md') {
      continue;
    }

    if (excludedBy(patterns, relative)) {
      continue;
    }

    kept.push(relative);
  }

  return kept.sort();
}

for (const project of projects) {
  const docsPath = path.join(cloneRoot, project.clone, project.docsRoot);
  const allowList = vendoredDocs.find((source) => source.project === project.slug);

  console.log(`\n${'='.repeat(74)}`);
  console.log(`${project.slug}`);
  console.log('='.repeat(74));

  if (!project.configPath) {
    const total = (await collectMarkdown(docsPath, docsPath, [])).length;

    console.log('  Repositório não publica configuração de site.');
    console.log(`  Sem critério do autor: ${total} páginas, todas candidatas.`);
    console.log('  A allow-list atual foi escolhida à mão e não tem base declarada.');

    continue;
  }

  const configSource = await readFile(
    path.join(cloneRoot, project.clone, project.configPath),
    'utf8',
  );
  const patterns = parseSrcExclude(configSource);
  const publishable = await collectMarkdown(docsPath, docsPath, patterns);

  // The allow-list records the upstream path of every page, which is what the
  // criterion applies to; the site slug is a separate, local naming.
  const importedPaths = new Set(
    (allowList?.pages ?? []).map((page) => page.sourcePath.replace(/^docs\//u, '')),
  );

  console.log(`  Critério: srcExclude com ${patterns.length} padrões do próprio projeto.`);
  console.log(`  Publicável segundo o critério: ${publishable.length} páginas.`);
  console.log(`  Na allow-list: ${importedPaths.size} páginas.`);
  console.log(
    `  Cobertura: ${((importedPaths.size / Math.max(publishable.length, 1)) * 100).toFixed(1)}%`,
  );

  const overreach = [...importedPaths].filter((entry) => !publishable.includes(entry));

  if (overreach.length > 0) {
    console.log(`\n  Importadas, mas o critério do projeto as exclui (${overreach.length}):`);

    for (const entry of overreach) {
      console.log(`    - ${entry}`);
    }
  }

  console.log(`\n  Primeiras 20 publicáveis ainda não importadas:`);
  const missing = publishable.filter((entry) => !importedPaths.has(entry));

  for (const entry of missing.slice(0, 20)) {
    console.log(`    + ${entry}`);
  }

  if (missing.length > 20) {
    console.log(`    … e mais ${missing.length - 20}`);
  }
}
