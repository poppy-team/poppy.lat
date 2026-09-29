/**
 * Maps the documentation trees that exist upstream.
 *
 * The site imports a curated selection, so the first question is how much
 * exists. This reports the shape of each repository's documentation: how many
 * pages per top-level directory, which of them have an English counterpart, and
 * which ones the current allow-list already covers.
 *
 * Usage: node --experimental-strip-types scripts/map-upstream-docs.ts <clone-dir>
 */

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { vendoredDocs } from '../packages/project-data/src/documentation.ts';

const cloneRoot = process.argv[2];

if (!cloneRoot) {
  console.error('Usage: map-upstream-docs.ts <clone-dir>');
  process.exit(1);
}

interface Count {
  portuguese: number;
  english: number;
}

async function countMarkdown(directory: string): Promise<number> {
  let total = 0;

  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return 0;
  }

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      total += await countMarkdown(entryPath);
    } else if (entry.name.endsWith('.md')) {
      total += 1;
    }
  }

  return total;
}

const projects = [
  { slug: 'aipo', clone: 'aipo-lang', docsRoot: 'docs', englishRoot: 'en' },
  { slug: 'oride', clone: 'oride', docsRoot: 'docs', englishRoot: 'docs/en' },
  { slug: 'prumo', clone: 'prumo', docsRoot: 'docs', englishRoot: 'en' },
];

const allowList = new Map<string, Set<string>>(
  vendoredDocs.map((source) => [source.project, new Set(source.pages.map((page) => page.slug))]),
);

for (const project of projects) {
  const docsPath = path.join(cloneRoot, project.clone, project.docsRoot);

  let entries: string[];
  try {
    entries = (await readdir(docsPath, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() || entry.name.endsWith('.md'))
      .map((entry) => entry.name);
  } catch {
    console.log(`\n${project.slug}: sem árvore de documentação em ${project.docsRoot}`);
    continue;
  }

  const covered = allowList.get(project.slug) ?? new Set<string>();
  const rows: { name: string; count: number; imported: number }[] = [];

  for (const entry of entries.sort()) {
    const entryPath = path.join(docsPath, entry);
    const isDirectory = !entry.endsWith('.md');

    if (!isDirectory && entry !== 'index.md') {
      continue;
    }

    const files = isDirectory ? await countMarkdown(entryPath) : 1;
    if (files === 0) {
      continue;
    }

    const names = isDirectory
      ? (await readdir(entryPath)).filter((name) => name.endsWith('.md'))
      : [entry];

    const imported = names.filter((name) =>
      covered.has(path.basename(name, '.md')),
    ).length;

    rows.push({ name: entry, count: files, imported });
  }

  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const importedTotal = rows.reduce((sum, row) => sum + row.imported, 0);

  console.log(`\n${'='.repeat(72)}`);
  console.log(`${project.slug} — ${total} páginas em ${project.clone}/${project.docsRoot}`);
  console.log(`${'='.repeat(72)}`);

  for (const row of rows) {
    const bar = row.imported === row.count ? '*' : ' ';
    console.log(
      `  ${row.name.padEnd(24)} ${String(row.count).padStart(4)} pág.  ` +
        `${row.imported}/${row.count} na allow-list ${bar}`,
    );
  }

  console.log(
    `  ${'TOTAL'.padEnd(24)} ${String(total).padStart(4)} pág.  ` +
      `${importedTotal}/${total} na allow-list`,
  );
}

/**
 * Whether a repository's own site config exists, which is what tells the
 * selection apart from an arbitrary subset: the config lists the sidebar the
 * project itself publishes.
 */
console.log(`\n${'='.repeat(72)}`);
console.log('Configuração de site presente no repositório');
console.log('='.repeat(72));

for (const project of projects) {
  const clonePath = path.join(cloneRoot, project.clone);
  const candidates = [
    path.join(clonePath, 'docs', '.vitepress', 'config.mts'),
    path.join(clonePath, 'docs', '.vitepress', 'config.ts'),
    path.join(clonePath, '.vitepress', 'config.mts'),
    path.join(clonePath, 'astro.config.mjs'),
  ];

  let found: string | null = null;
  for (const candidate of candidates) {
    try {
      await readFile(candidate, 'utf8');
      found = path.relative(clonePath, candidate);
      break;
    } catch {
      continue;
    }
  }

  console.log(`  ${project.slug.padEnd(10)} ${found ?? '(nenhuma)'}`);
}
