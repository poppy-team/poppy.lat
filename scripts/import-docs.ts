/**
 * Builds each project's documentation subsite from the project's own publish
 * criterion.
 *
 * The Aipo and Prumo repositories ship the VitePress config for their own
 * site, and its `srcExclude` list is the set of paths those projects decided
 * not to publish. This walks the documentation tree, keeps what that criterion
 * allows, and copies it at the pinned revision. The allow-list is therefore
 * derived from the project rather than picked here.
 *
 * Ori and Oride publish no site config upstream, so they keep the explicit
 * page list declared in packages/project-data.
 *
 * Usage: node --experimental-strip-types scripts/import-docs.ts <clone-dir>
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { projects } from '../packages/project-data/src/projects.ts';
import { vendoredDocs, type DocsCategory } from '../packages/project-data/src/index.ts';

const cloneRoot = process.argv[2];

if (!cloneRoot) {
  console.error('Usage: import-docs.ts <dir with ori-lang/, aipo-lang/, oride/, prumo/>');
  process.exit(1);
}

interface UpstreamProject {
  slug: string;
  clone: string;
  repository: string;
  configPath: string | null;
  docsRoot: string;
  englishRoot: string | null;
}

const upstreamProjects: UpstreamProject[] = [
  {
    slug: 'ori',
    clone: 'ori-lang',
    repository: 'https://github.com/poppy-team/ori-lang',
    configPath: null,
    docsRoot: 'docs',
    englishRoot: null,
  },
  {
    slug: 'aipo',
    clone: 'aipo-lang',
    repository: 'https://github.com/poppy-team/aipo-lang',
    configPath: 'docs/.vitepress/config.mts',
    docsRoot: 'docs',
    englishRoot: 'en',
  },
  {
    slug: 'oride',
    clone: 'oride',
    repository: 'https://github.com/poppy-team/oride',
    configPath: null,
    docsRoot: 'docs',
    englishRoot: 'en',
  },
  {
    slug: 'prumo',
    clone: 'prumo',
    repository: 'https://github.com/poppy-team/prumo',
    configPath: 'docs/.vitepress/config.mts',
    docsRoot: 'docs',
    englishRoot: 'en',
  },
];

function parseSrcExclude(source: string): string[] {
  const match = source.match(/srcExclude:\s*\[([\s\S]*?)\]/u);

  if (!match?.[1]) {
    return [];
  }

  return [...match[1].matchAll(/'([^']+)'/gu)].map((entry) => entry[1] ?? '');
}

function isExcluded(patterns: string[], relativePath: string): boolean {
  // Patterns are authored against the Portuguese tree, so the English prefix is
  // removed before comparing.
  const normalized = relativePath.replace(/^en\//u, '');

  return patterns.some((pattern) => {
    // A whole directory, written as `**/dir/**`.
    if (pattern.endsWith('/**')) {
      const directory = pattern.replace(/^\*\*\//u, '').replace(/\/\*\*$/u, '');

      return normalized.includes(`${directory}/`);
    }

    // A single file. The pattern may name a directory too, as in
    // `**/harness/open-work.md`, so the suffix is compared against the tail
    // of the path rather than the bare file name.
    if (pattern.endsWith('.md')) {
      const suffix = pattern.replace(/^\*\*\//u, '');

      return normalized === suffix || normalized.endsWith(`/${suffix}`);
    }

    return false;
  });
}

/**
 * Upstream directories mapped to the site's three audiences. A directory that
 * is absent falls into `development`, so a new upstream directory lands
 * somewhere deliberate rather than nowhere.
 */
const categoryByDirectory: Record<string, DocsCategory> = {
  'getting-started': 'guides',
  manual: 'guides',
  examples: 'guides',
  tools: 'guides',
  language: 'guides',
  trajectory: 'guides',
  'user-guide': 'guides',
  guides: 'guides',
  installation: 'guides',
  reference: 'guides',
  packages: 'guides',
  architecture: 'development',
  decisions: 'development',
  adr: 'development',
  adp: 'development',
  contracts: 'development',
  authoring: 'development',
  harness: 'development',
  workforce: 'development',
  skills: 'development',
  runtime: 'development',
  zoe: 'development',
  design: 'development',
  development: 'development',
  governance: 'development',
  conformance: 'development',
  quality: 'development',
  'ui-ux': 'development',
  systems: 'development',
  integration: 'development',
  migration: 'development',
  evidence: 'development',
  canon: 'development',
  diagnostics: 'development',
  operations: 'development',
  testing: 'development',
  waves: 'development',
  crates: 'development',
};

function categoryFor(relativePath: string): DocsCategory {
  const withoutLocale = relativePath.replace(/^en\//u, '');

  return categoryByDirectory[withoutLocale.split('/')[0] ?? ''] ?? 'development';
}

interface UpstreamPage {
  relativePath: string;
  category: DocsCategory;
  blob: string;
}

async function collectPages(
  project: UpstreamProject,
  revision: string,
  patterns: string[],
  subtree: string,
  /** Prefix stripped from the collected paths, so a route never nests twice. */
  stripPrefix = '',
): Promise<UpstreamPage[]> {
  const docsPath = path.join(cloneRoot, project.clone, project.docsRoot);
  const root = subtree === '' ? docsPath : path.join(docsPath, subtree);
  const found: UpstreamPage[] = [];

  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return found;
  }

  for (const entry of entries) {
    const entryPath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      // The English tree is walked separately, so a page without a
      // translation is distinguishable from one never written.
      if (entry.name === (project.englishRoot ?? ' ')) {
        continue;
      }

      found.push(
        ...(await collectPages(
          project,
          revision,
          patterns,
          path.join(subtree, entry.name),
          stripPrefix,
        )),
      );
      continue;
    }

    if (!entry.name.endsWith('.md') || entry.name === 'index.md') {
      // An index describes a directory rather than a source file, so it is
      // written by the caller rather than copied.
      continue;
    }

    const relativeToDocs = path.join(subtree, entry.name).split(path.sep).join('/');

    if (isExcluded(patterns, relativeToDocs)) {
      continue;
    }

    const routePath = relativeToDocs.startsWith(`${stripPrefix}`)
      ? relativeToDocs.slice(stripPrefix.length)
      : relativeToDocs;

    const relativeToRepo = path
      .join(project.docsRoot, subtree, entry.name)
      .split(path.sep)
      .join('/');

    const blob = execFileSync(
      'git',
      ['-C', path.join(cloneRoot, project.clone), 'rev-parse', `${revision}:${relativeToRepo}`],
      { encoding: 'utf8' },
    ).trim();

    found.push({ relativePath: routePath, category: categoryFor(relativeToDocs), blob });
  }

  return found.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

function slugFor(relativePath: string): string {
  return relativePath.replace(/\.md$/u, '').replace(/(^|\/)index$/u, '$1');
}

function titleFrom(relativePath: string, projectName: string): string {
  const name = (relativePath.split('/').pop() ?? relativePath).replace(/\.md$/u, '');

  if (name === 'index') {
    return projectName;
  }

  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function frontmatterFor(
  page: UpstreamPage,
  locale: string,
  project: string,
  projectName: string,
  source: { path: string; blob: string; revision: string; license: string },
): string {
  const title = titleFrom(page.relativePath, projectName);

  return [
    '---',
    `title: ${JSON.stringify(title)}`,
    `description: ${JSON.stringify(`${projectName} — ${title}`)}`,
    `project: ${project}`,
    `category: ${page.category}`,
    `locale: ${locale}`,
    `sourcePath: ${JSON.stringify(source.path)}`,
    `sourceBlob: ${JSON.stringify(source.blob)}`,
    `revision: ${JSON.stringify(source.revision)}`,
    `license: ${JSON.stringify(source.license)}`,
    '---',
    '',
  ].join('\n');
}

function provenanceBlock(source: {
  path: string;
  repository: string;
  revision: string;
  blob: string;
  license: string;
}): string {
  return [
    '::: info Cópia estática',
    `Copiado de \`${source.path}\` em [${source.repository}](${source.repository}) (${source.license}).`,
    `Fixado na revisão \`${source.revision}\`, blob \`${source.blob}\`.`,
    'O repositório de origem permanece canônico; esta cópia não é atualizada automaticamente.',
    ':::',
    '',
  ].join('\n');
}

/** Points a relative asset reference at the vendored copy under /assets. */
function rewriteAssetPaths(body: string): string {
  return body.replaceAll(
    /(\]\()(?:\.\.\/)+assets\/([^)]+)(\))/gu,
    '$1/assets/$2$3',
  );
}

/**
 * A reference the vendored tree cannot satisfy: a file outside the
 * documentation tree, a sibling directory that was excluded, or a page that
 * belongs to another project. It is pointed at the pinned upstream file so the
 * reader still reaches the content instead of a dead link.
 */
function pointAtUpstream(
  label: string,
  target: string,
  anchor: string,
  sourcePath: string,
  repository: string,
  revision: string,
): string {
  const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(sourcePath), target));

  return `[${label}](${repository}/blob/${revision}/${resolved}${anchor})`;
}

/**
 * Points an upstream cross-link at the vendored route when the target exists.
 * An unvendored target is left alone so the build's link check reports it
 * rather than the copy shipping a dead link.
 */
function rewriteLinks(
  body: string,
  pages: UpstreamPage[],
  resolve: (label: string, target: string, anchor: string) => string | null,
): string {
  const byFileName = new Map<string, string>();
  const byRoutePath = new Map<string, string>();

  for (const page of pages) {
    const fileName = page.relativePath.split('/').pop();
    const route = `${page.category}/${slugFor(page.relativePath)}`;

    if (fileName) {
      byFileName.set(fileName, route);
    }

    byRoutePath.set(slugFor(page.relativePath), route);
  }

  return rewriteAssetPaths(body).replaceAll(
    /\[([^\]]*)\]\(([^)\s:]+)(#[^)]*)?\)/gu,
    (match, label: string, target: string, anchor: string) => {
      const asString = String(target);

      if (asString.startsWith('http') || asString.startsWith('#') || asString.startsWith('mailto:')) {
        return match;
      }

      // An absolute path belongs to the upstream site, not to this subsite.
      if (asString.startsWith('/')) {
        return resolve(label, `../${asString.replace(/^\//u, '')}`, anchor ?? '');
      }

      const withoutExtension = asString.replace(/\.md$/u, '');
      const direct = byFileName.get(`${asString.split('/').pop() ?? ''}`);

      if (direct) {
        return `](${direct}${anchor ?? ''})`;
      }

      const byPath = byRoutePath.get(withoutExtension.replace(/^\.\//u, ''));

      if (byPath) {
        return `](${byPath}${anchor ?? ''})`;
      }

      return resolve(label, asString, anchor ?? '') ?? match;
    },
  );
}

/**
 * Writes the landing page of a subsite and the index of each category. They
 * carry no upstream blob: they describe the vendored tree rather than copying
 * a file.
 */
async function writeIndexes(
  project: UpstreamProject,
  projectName: string,
  locale: string,
  localePrefix: string,
  pages: UpstreamPage[],
): Promise<void> {
  const usedCategories = [...new Set(pages.map((page) => page.category))].sort();

  await mkdir(path.join('site', localePrefix, project.slug, 'docs'), { recursive: true });
  await writeFile(
    path.join('site', localePrefix, project.slug, 'docs', 'index.md'),
    [
      '---',
      'layout: docs-landing',
      `title: ${JSON.stringify(projectName)}`,
      `description: ${JSON.stringify(`${projectName} — documentação`)}`,
      `project: ${project.slug}`,
      `locale: ${locale}`,
      '---',
      '',
    ].join('\n'),
    'utf8',
  );

  if (usedCategories.length === 0) {
    // A project with no pages in this locale still needs its landing page,
    // which the layouts read to explain the absence.
    return;
  }

  for (const category of usedCategories) {
    const inCategory = pages.filter((page) => page.category === category);
    const directory = path.join('site', localePrefix, project.slug, 'docs', category);

    await mkdir(directory, { recursive: true });
    await writeFile(
      path.join('site', localePrefix, project.slug, 'docs', category, 'index.md'),
      [
        '---',
        'layout: docs-category',
        `title: ${JSON.stringify(category)}`,
        `description: ${JSON.stringify(`${projectName} — ${category}`)}`,
        `project: ${project.slug}`,
        `category: ${category}`,
        `locale: ${locale}`,
        '---',
        '',
        ...inCategory.map(
          (page) => `- [${titleFrom(page.relativePath, projectName)}](./${slugFor(page.relativePath)})`,
        ),
        '',
      ].join('\n'),
      'utf8',
    );
  }
}

/**
 * Writes the module the theme imports, listing what was published. Generated
 * here because this is the step that knows the result.
 */
async function writeImportedDocsModule(): Promise<void> {
  const projectRoot = path.join(import.meta.dirname, '..');
  const pages: Record<string, unknown[]> = {};

  for (const project of upstreamProjects) {
    const entries: unknown[] = [];

    for (const [localePrefix, locale] of [
      ['', 'pt-BR'],
      ['en', 'en'],
    ] as const) {
      const docsRoot = path.join(projectRoot, 'site', localePrefix, project.slug, 'docs');
      const urlPrefix = localePrefix === 'en' ? 'en/' : '';

      const walk = (directory: string, prefix = ''): void => {
        let items;
        try {
          items = readdirSync(directory, { withFileTypes: true });
        } catch {
          return;
        }

        for (const item of items) {
          const itemPath = path.join(directory, item.name);

          if (item.isDirectory()) {
            walk(itemPath, `${prefix}${item.name}/`);
            continue;
          }

          if (!item.name.endsWith('.md') || item.name === 'index.md') {
            continue;
          }

          const source = readFileSync(itemPath, 'utf8');
          const read = (field: string): string => {
            const match = source.match(new RegExp(`^${field}:\\s*(.+)$`, 'mu'));

            if (!match?.[1]) {
              return '';
            }

            try {
              return JSON.parse(match[1].trim()) as string;
            } catch {
              return match[1].trim();
            }
          };

          const route = `${prefix}${item.name.replace(/\.md$/u, '')}`;

          entries.push({
            route: `/${urlPrefix}${project.slug}/docs/${route}/`,
            slug: route.split('/').pop(),
            category: read('category') || 'development',
            title: read('title'),
            description: read('description'),
            locale,
          });
        }
      };

      walk(docsRoot);
    }

    pages[project.slug] = entries;
  }

  await writeFile(
    path.join(projectRoot, 'site/imported-docs.ts'),
    [
      '/**',
      ' * Documentation pages read from the imported tree.',
      ' *',
      ' * GENERATED by scripts/import-docs.ts. Edit the import, not this file.',
      ' */',
      '',
      "import type { DocsCategory, Locale } from '@poppy/project-data';",
      '',
      'export interface ImportedDocPage {',
      '  route: string;',
      '  slug: string;',
      '  category: DocsCategory;',
      '  title: string;',
      '  description: string;',
      '  locale: Locale;',
      '}',
      '',
      `export const importedDocs: Record<string, ImportedDocPage[]> = ${JSON.stringify(pages, null, 2)};`,
      '',
    ].join('\n'),
    'utf8',
  );
}

interface ImportSummary {
  project: string;
  portugueseCount: number;
  english: number;
  mode: string;
}

const summaries: ImportSummary[] = [];

for (const project of upstreamProjects) {
  const source = vendoredDocs.find((entry) => entry.project === project.slug);
  const revision = source?.revision ?? '';
  const license = source?.license ?? 'MIT';
  const projectName = projects.find((entry) => entry.slug === project.slug)?.name ?? project.slug;

  if (!revision) {
    console.error(`No pinned revision for ${project.slug}; the manifest is out of date.`);
    process.exit(1);
  }

  // Without an upstream site config there is no declared criterion, so the
  // explicit page list in packages/project-data is what gets published.
  if (!project.configPath) {
    let written = 0;
    let writtenEnglish = 0;

    for (const page of source?.pages ?? []) {
      const variants: { upstreamPath: string; locale: string; prefix: string }[] = [
        { upstreamPath: page.sourcePath, locale: 'pt-BR', prefix: '' },
      ];

      if (page.englishSourcePath && page.englishSourceBlob) {
        variants.push({
          upstreamPath: page.englishSourcePath,
          locale: 'en',
          prefix: 'en',
        });
      }

      for (const variant of variants) {
        const blob = execFileSync(
          'git',
          ['-C', path.join(cloneRoot, project.clone), 'rev-parse', `${revision}:${variant.upstreamPath}`],
          { encoding: 'utf8' },
        ).trim();

        const body = execFileSync(
          'git',
          ['-C', path.join(cloneRoot, project.clone), 'show', `${revision}:${variant.upstreamPath}`],
          { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
        );

        const destination = path.join(
          'site',
          variant.prefix,
          project.slug,
          'docs',
          page.category,
          `${page.slug}.md`,
        );

        await mkdir(path.dirname(destination), { recursive: true });
        await writeFile(
          destination,
          [
            '---',
            `title: ${JSON.stringify(page.title[variant.locale as 'pt-BR' | 'en'])}`,
            `description: ${JSON.stringify(page.description[variant.locale as 'pt-BR' | 'en'])}`,
            `project: ${project.slug}`,
            `category: ${page.category}`,
            `locale: ${variant.locale}`,
            `sourcePath: ${JSON.stringify(variant.upstreamPath)}`,
            `sourceBlob: ${JSON.stringify(blob)}`,
            `revision: ${JSON.stringify(revision)}`,
            `license: ${JSON.stringify(license)}`,
            '---',
            '',
          ].join('\n') +
            provenanceBlock({
              path: variant.upstreamPath,
              repository: project.repository,
              revision,
              blob,
              license,
            }) +
            rewriteLinks(body, [], (label, target, anchor) =>
              pointAtUpstream(
                label,
                target,
                anchor,
                variant.upstreamPath,
                project.repository,
                revision,
              ),
            ),
          'utf8',
        );

        if (variant.locale === 'en') {
          writtenEnglish += 1;
        } else {
          written += 1;
        }
      }
    }

    // The indexes describe the vendored tree, so they are written for these
    // projects too, from the same explicit list.
    const asPages = (entries: { category: DocsCategory; slug: string }[]): UpstreamPage[] =>
      entries.map((entry) => ({
        relativePath: `${entry.slug}.md`,
        category: entry.category,
        blob: '',
      }));

    const declared = source?.pages ?? [];
    const portuguesePages = asPages(declared);
    const englishPages = asPages(declared.filter((page) => page.englishSourcePath));

    await writeIndexes(project, projectName, 'pt-BR', '', portuguesePages);

    if (englishPages.length > 0) {
      await writeIndexes(project, projectName, 'en', 'en', englishPages);
    }

    summaries.push({
      project: project.slug,
      portugueseCount: written,
      english: writtenEnglish,
      mode: 'lista explícita, sem critério upstream',
    });
    continue;
  }

  const configSource = await readFile(
    path.join(cloneRoot, project.clone, project.configPath),
    'utf8',
  );
  const patterns = parseSrcExclude(configSource);
  const portuguese = await collectPages(project, revision, patterns, '');
  const english = project.englishRoot
    ? await collectPages(
        project,
        revision,
        patterns,
        project.englishRoot,
        `${project.englishRoot}/`,
      )
    : [];

  const passes = [
    { locale: 'pt-BR', pages: portuguese, localePrefix: '', prefixInDocs: '' },
    { locale: 'en', pages: english, localePrefix: 'en', prefixInDocs: project.englishRoot ?? '' },
  ] as const;

  for (const pass of passes) {
    for (const page of pass.pages) {
      const sourcePath = path
        .join(project.docsRoot, page.relativePath)
        .split(path.sep)
        .join('/');

      const body = execFileSync(
        'git',
        ['-C', path.join(cloneRoot, project.clone), 'show', `${revision}:${sourcePath}`],
        { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
      );

      const destination = path.join(
        'site',
        pass.localePrefix,
        project.slug,
        'docs',
        page.category,
        `${slugFor(page.relativePath)}.md`,
      );

      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(
        destination,
        frontmatterFor(page, pass.locale, project.slug, projectName, {
          path: sourcePath,
          blob: page.blob,
          revision,
          license,
        }) +
          provenanceBlock({
            path: sourcePath,
            repository: project.repository,
            revision,
            blob: page.blob,
            license,
          }) +
          rewriteLinks(body, pass.pages, (label, target, anchor) =>
            pointAtUpstream(
              label,
              target,
              anchor,
              sourcePath,
              project.repository,
              revision,
            ),
          ),
        'utf8',
      );
    }
  }

  await writeIndexes(project, projectName, 'pt-BR', '', portuguese);

  if (project.englishRoot) {
    await writeIndexes(project, projectName, 'en', 'en', english);
  }


  summaries.push({
    project: project.slug,
    portugueseCount: portuguese.length,
    english: english.length,
    mode: `srcExclude com ${patterns.length} padrões`,
  });
}

await writeImportedDocsModule();

for (const summary of summaries) {
  const english =
    summary.english > 0 ? `, ${summary.english} em inglês` : ', sem árvore em inglês';

  console.log(`${summary.project}: ${summary.portugueseCount} páginas${english} — ${summary.mode}`);
}
