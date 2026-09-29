/**
 * Builds the documentation tree from upstream repositories.
 *
 * Reads each page declared in packages/project-data/src/documentation.ts and
 * writes it under docs/ with a provenance header naming the repository,
 * revision, and blob it was copied from. Upstream repositories stay canonical;
 * this produces a static copy that does not auto-update.
 *
 * A page with an `englishSourcePath` gets a real English copy. A page without
 * one still gets an English route, but it is a stub that points the reader at
 * the repository instead of duplicating untranslated Portuguese.
 *
 * Usage: node --experimental-strip-types scripts/import-docs.ts <clone-dir>
 */

import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  ORIDE_REVISION,
  vendoredDocs,
  type VendoredDocSource,
  type VendoredDocPage,
} from '../packages/project-data/src/documentation.ts';
import { projects, type Locale } from '../packages/project-data/src/projects.ts';

const cloneRoot = process.argv[2];

if (!cloneRoot) {
  console.error('Usage: import-docs.ts <dir containing ori-lang/, aipo-lang/, oride/, prumo/>');
  process.exit(1);
}

function cloneFor(source: VendoredDocSource): string {
  const name = source.repository.replace('https://github.com/poppy-team/', '');

  return path.join(cloneRoot, name);
}

function localeDirectory(locale: Locale): string {
  return locale === 'en' ? 'en' : '';
}

function englishPendingStub(source: VendoredDocSource, page: VendoredDocPage): string {
  const frontmatter = [
    '---',
    `title: ${JSON.stringify(page.title.en)}`,
    `description: ${JSON.stringify(page.description.en)}`,
    `project: ${source.project}`,
    `category: ${page.category}`,
    'locale: en',
    'translationPending: true',
    '---',
    '',
  ].join('\n');

  const body = [
    '::: warning Translation pending',
    `This page has not been translated into English yet. The Portuguese version`,
    `and the canonical source are both available upstream.`,
    ':::',
    '',
    `- [Read it in Portuguese](/${source.project}/docs/${page.category}/${page.slug})`,
    `- [Read the canonical source](${source.repository}/blob/${source.revision}/${page.sourcePath})`,
    '',
  ].join('\n');

  return frontmatter + body;
}

/**
 * Upstream pages cross-link siblings by their original filename, e.g.
 * `[Themes](themes.md)`. Those filenames no longer exist here, so each link is
 * resolved to the vendored route of the same category — and to the canonical
 * repository when the target is not part of the allow-list.
 */
function rewriteSiblingLinks(body: string, source: VendoredDocSource, page: VendoredDocPage): string {
  const siblingRoutes = new Map<string, string>();

  for (const sibling of source.pages) {
    if (sibling.category === page.category) {
      siblingRoutes.set(`${sibling.slug}.md`, `${sibling.slug}`);
    }
  }

  return body.replaceAll(/\]\(([^)\s:]+\.md)(#[^)]*)?\)/g, (match, target: string, anchor: string) => {
    if (target.startsWith('http')) {
      return match;
    }

    const filename = target.split('/').pop() ?? target;
    const vendored = siblingRoutes.get(filename);

    if (vendored) {
      return `](${vendored}${anchor ?? ''})`;
    }

    // Not vendored: point at the pinned upstream file so the reader still
    // reaches the content instead of a dead link.
    return `](${source.repository}/blob/${source.revision}/${page.sourcePath.replace(/[^/]+$/, filename)}${anchor ?? ''})`;
  });
}

/**
 * Some upstream pages link to sibling directories with root-absolute paths,
 * e.g. `/getting-started/installation`. Those are resolved to the vendored
 * route when the target is allow-listed, and to the pinned upstream tree
 * otherwise.
 */
function rewriteRootLinks(body: string, source: VendoredDocSource): string {
  const vendoredRoutes = new Map<string, string>();

  for (const sibling of source.pages) {
    vendoredRoutes.set(`/${sibling.slug}`, `${sibling.slug}`);
  }

  return body.replaceAll(/\]\((\/[^)\s:]+)(#[^)]*)?\)/g, (match, target: string, anchor: string) => {
    const vendored = vendoredRoutes.get(target.replace(/\/$/, ''));

    if (vendored) {
      return `](${vendored}${anchor ?? ''})`;
    }

    return `](${source.repository}/tree/${source.revision}/docs${target}${anchor ?? ''})`;
  });
}

async function importPage(
  source: VendoredDocSource,
  page: VendoredDocPage,
  locale: Locale,
): Promise<void> {
  const upstreamPath = locale === 'en' ? page.englishSourcePath : page.sourcePath;
  const blob = locale === 'en' ? page.englishSourceBlob : page.sourceBlob;

  // Each project owns a subsite: the project slug comes first, so the
  // documentation lives inside the project rather than in a shared /docs.
  const destination = path.join(
    'site',
    localeDirectory(locale),
    source.project,
    'docs',
    page.category,
    `${page.slug}.md`,
  );

  await mkdir(path.dirname(destination), { recursive: true });

  if (!upstreamPath || !blob) {
    await writeFile(destination, englishPendingStub(source, page), 'utf8');

    return;
  }

  // Read through git at the pinned revision rather than the working tree, so
  // a repository that moved ahead cannot leak newer content into the copy.
  const actualBlob = execFileSync(
    'git',
    ['-C', cloneFor(source), 'rev-parse', `${source.revision}:${upstreamPath}`],
    { encoding: 'utf8' },
  ).trim();

  if (actualBlob !== blob) {
    throw new Error(
      `Blob drift for ${source.repository} ${upstreamPath}: manifest says ${blob}, repository has ${actualBlob}`,
    );
  }

  const body = execFileSync(
    'git',
    ['-C', cloneFor(source), 'show', `${source.revision}:${upstreamPath}`],
    { encoding: 'utf8' },
  );

  // Images referenced by the guides are vendored under /assets, so their
  // relative upstream paths are rewritten to the absolute public path.
  const rewrittenAssets = body.replaceAll(
    /(\]\()(?:\.\.\/)+assets\/([^)]+)(\))/g,
    '$1/assets/$2$3',
  );

  // Every other relative file reference — examples, sample configs — is not
  // vendored, so it is pointed at the pinned upstream file instead. The link
  // text may be wrapped in backticks, hence the optional backtick in the label.
  const rewrittenFiles = rewrittenAssets.replaceAll(
    /\[`?([^\]]*?)`?\]\((?!https?:|\/|#|\.\/)([^)\s:]+)(\))\n?/g,
    (_match, label: string, target: string, close: string) => {
      const resolved = path.posix.normalize(
        path.posix.join(path.posix.dirname(page.sourcePath), target),
      );

      return `[${label}](${source.repository}/blob/${source.revision}/${resolved})${close}`;
    },
  );

  // Upstream pages cross-link siblings by their original filename, e.g.
  // `[Themes](themes.md)`. Those filenames no longer exist here, so each link is
  // resolved to the vendored route of the same category — and to the canonical
  // repository when the target is not part of the allow-list.
  const rewrittenBody = rewriteRootLinks(
    rewriteSiblingLinks(rewrittenFiles, source, page),
    source,
  );
  const frontmatter = [
    '---',
    `title: ${JSON.stringify(page.title[locale])}`,
    `description: ${JSON.stringify(page.description[locale])}`,
    `project: ${source.project}`,
    `category: ${page.category}`,
    `locale: ${locale}`,
    `sourcePath: ${JSON.stringify(upstreamPath)}`,
    `sourceBlob: ${JSON.stringify(blob)}`,
    `revision: ${JSON.stringify(source.revision)}`,
    `license: ${JSON.stringify(source.license)}`,
    '---',
    '',
  ].join('\n');

  const provenance = [
    '::: info Static copy',
    `Copied from \`${upstreamPath}\` in [${source.repository}](${source.repository}) (${source.license}).`,
    `Pinned to revision \`${source.revision}\`, blob \`${blob}\`.`,
    'The upstream repository stays canonical; this copy is not updated automatically.',
    ':::',
    '',
  ].join('\n');

  await writeFile(destination, frontmatter + provenance + rewrittenBody, 'utf8');
}

async function writeLanding(source: VendoredDocSource, locale: Locale): Promise<void> {
  const project = projects.find((item) => item.slug === source.project);

  if (!project) {
    throw new Error(`Unknown project: ${source.project}`);
  }

  const frontmatter = [
    '---',
    'layout: docs-landing',
    `title: ${JSON.stringify(project.name)}`,
    `description: ${JSON.stringify(project.homeSummary[locale])}`,
    `project: ${source.project}`,
    `locale: ${locale}`,
    '---',
    '',
  ].join('\n');

  const destination = path.join('site', localeDirectory(locale), source.project, 'docs', 'index.md');

  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, frontmatter, 'utf8');
}

async function writeCategoryIndexes(source: VendoredDocSource, locale: Locale): Promise<void> {
  const categoryLabels: Record<VendoredDocPage['category'], { pt: string; en: string }> = {
    guides: { pt: 'Guia de uso', en: 'User guide' },
    roadmap: { pt: 'Novidades e planos', en: 'Changelog and plans' },
    development: { pt: 'Desenvolvimento', en: 'Development' },
  };

  const used = [...new Set(source.pages.map((page) => page.category))];

  for (const category of used) {
    const frontmatter = [
      '---',
      'layout: docs-category',
      `title: ${JSON.stringify(categoryLabels[category][locale === 'en' ? 'en' : 'pt'])}`,
      `project: ${source.project}`,
      `category: ${category}`,
      `locale: ${locale}`,
      '---',
      '',
    ].join('\n');

    const destination = path.join('site', localeDirectory(locale), source.project, 'docs', category, 'index.md');

    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, frontmatter, 'utf8');
  }
}

/**
 * Images referenced by imported pages. Copied at the pinned revision so a page
 * never renders an asset from a different upstream state.
 */
const vendoredAssets: { repository: string; revision: string; path: string; destination: string }[] = [
  {
    repository: 'https://github.com/poppy-team/oride',
    revision: ORIDE_REVISION,
    path: 'assets/oride-interface.png',
    destination: 'site/public/assets/oride-interface.png',
  },
];

async function importAssets(): Promise<void> {
  for (const asset of vendoredAssets) {
    const name = asset.repository.replace('https://github.com/poppy-team/', '');
    const bytes = execFileSync(
      'git',
      ['-C', path.join(cloneRoot, name), 'show', `${asset.revision}:${asset.path}`],
      { maxBuffer: 64 * 1024 * 1024 },
    );

    await mkdir(path.dirname(asset.destination), { recursive: true });
    await writeFile(asset.destination, bytes);
    console.log(`asset ${asset.path} -> ${asset.destination}`);
  }
}

await importAssets();

for (const source of vendoredDocs) {
  // The pinned revision must exist locally, but it may be behind HEAD: the
  // allow-list intentionally freezes an older state.
  const pinnedExists = execFileSync(
    'git',
    ['-C', cloneFor(source), 'cat-file', '-t', source.revision],
    { encoding: 'utf8' },
  ).trim();

  if (pinnedExists !== 'commit') {
    throw new Error(`Pinned revision ${source.revision} is not a commit in ${source.repository}`);
  }

  for (const page of source.pages) {
    await importPage(source, page, 'pt-BR');
    await importPage(source, page, 'en');
  }

  await writeLanding(source, 'pt-BR');
  await writeLanding(source, 'en');
  await writeCategoryIndexes(source, 'pt-BR');
  await writeCategoryIndexes(source, 'en');

  const translated = source.pages.filter((page) => page.englishSourcePath).length;

  console.log(
    `${source.project}: ${source.pages.length} pages (${translated} with English), revision pinned`,
  );
}
