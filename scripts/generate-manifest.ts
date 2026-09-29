/**
 * Emits site/public/sources.json, the public allow-list of vendored
 * documentation.
 *
 * The manifest is generated from the imported files themselves rather than
 * from the declaration that produced them, so it cannot drift from what the
 * build actually published. Each page records the repository, revision, blob
 * and license copied from its own frontmatter, which the import wrote after
 * checking every blob against the pinned revision.
 */

import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { vendoredDocs } from '../packages/project-data/src/documentation.ts';

interface ManifestPage {
  locale: 'pt-BR' | 'en';
  sourcePath: string;
  sourceBlob: string;
  localPath: string;
  category: string;
  status: 'vendored' | 'translation-pending';
}

const siteRoot = 'site';

async function collectMarkdown(directory: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }

  const found: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      found.push(...(await collectMarkdown(entryPath)));
      continue;
    }

    if (entry.name.endsWith('.md') && entry.name !== 'index.md') {
      found.push(entryPath);
    }
  }

  return found.sort();
}

/** Reads a scalar field out of a page's frontmatter. */
function readField(source: string, field: string): string {
  const match = source.match(new RegExp(`^${field}:\\s*(.+)$`, 'mu'));

  if (!match?.[1]) {
    return '';
  }

  const raw = match[1].trim();

  try {
    return JSON.parse(raw) as string;
  } catch {
    return raw;
  }
}

/** Projects whose repository ships a VitePress config with a srcExclude. */
const projectsWithSiteConfig = new Set(['aipo', 'prumo']);

const sources: {
  project: string;
  repository: string;
  revision: string;
  license: string;
  licenseFile: string;
  criterion: string;
  pages: ManifestPage[];
}[] = [];

for (const project of vendoredDocs) {
  const pages: ManifestPage[] = [];

  for (const [localePrefix, locale] of [
    ['', 'pt-BR'],
    ['en', 'en'],
  ] as const) {
    const directory = path.join(siteRoot, localePrefix, project.project, 'docs');

    for (const file of await collectMarkdown(directory)) {
      const source = await readFile(file, 'utf8');
      const sourcePath = readField(source, 'sourcePath');
      const sourceBlob = readField(source, 'sourceBlob');

      pages.push({
        locale,
        sourcePath,
        sourceBlob,
        localPath: file.split(path.sep).join('/'),
        category: readField(source, 'category'),
        // A page without a revision or blob is a site-authored stub, not a
        // copy: it declares a translation that does not exist upstream yet.
        status: sourcePath && sourceBlob ? 'vendored' : 'translation-pending',
      });
    }
  }

  // A project that ships a site config publishes the set its own authors
  // chose; one that does not has its pages listed explicitly here.
  const derivesFromUpstream = projectsWithSiteConfig.has(project.project);
  const declared = project.pages.length;

  sources.push({
    project: project.project,
    repository: project.repository,
    revision: project.revision,
    license: project.license,
    licenseFile: project.licenseFile,
    criterion: derivesFromUpstream
      ? `srcExclude declarado em ${project.repository}`
      : `lista explícita em packages/project-data (${declared} páginas)`,
    pages,
  });
}

const manifest = {
  schemaVersion: 3,
  purpose:
    'Allow-list da documentação pública copiada para os subsites de cada projeto.',
  canonicality:
    'Os repositórios de origem são as fontes canônicas; as cópias locais não são atualizadas automaticamente.',
  updatedAt: new Date().toISOString().slice(0, 10),
  generator: 'scripts/generate-manifest.ts',
  documentationCategories: {
    guides: 'Conceitos, primeiros passos e referência de uso.',
    roadmap: 'Histórico de versões e planos futuros.',
    development: 'Arquitetura interna e material para quem contribui.',
  },
  siteRoutes: {
    sourceManifest: '/sources.json',
    thirdPartyNotices: '/third-party-notices.txt',
  },
  sources,
  excludedAreas: [
    'diretórios que o próprio projeto exclui da publicação no srcExclude do config do site dele',
    'arquivos fora da árvore de documentação, como changelog e roadmap na raiz do repositório',
    'conteúdo de execução, runtime ou playground',
  ],
};

await writeFile('site/public/sources.json', `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const total = sources.reduce((sum, source) => sum + source.pages.length, 0);

console.log(`sources.json: ${sources.length} projetos, ${total} entradas`);

for (const source of sources) {
  console.log(`  ${source.project}: ${source.pages.length} páginas — ${source.criterion}`);
}
