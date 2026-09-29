import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { projects } from '../packages/project-data/src/projects.ts';
import { vendoredDocs } from '../packages/project-data/src/documentation.ts';

const projectRoot = process.cwd();
const outputRoot = path.join(projectRoot, 'site', '.vitepress', 'dist');
const siteRoot = path.join(projectRoot, 'site');

async function readRoute(route: string): Promise<string> {
  const routePath = decodeURIComponent(new URL(route, 'https://poppy.test').pathname);
  const segments = routePath.split('/').filter(Boolean);
  const routeFile = path.join(outputRoot, ...segments);

  const candidates = routePath.endsWith('/')
    ? [path.join(routeFile, 'index.html'), `${routeFile}.html`]
    : [routeFile, `${routeFile}.html`];

  for (const candidate of candidates) {
    if (await exists(candidate)) {
      return readFile(candidate, 'utf8');
    }
  }

  throw new Error(`No built file for route ${route}; tried ${candidates.join(', ')}`);
}

/**
 * Pages actually imported for a project, read from the tree. The declared list
 * in packages/project-data is empty for the projects whose pages come from the
 * upstream criterion, so the build output is the only complete source.
 */
async function importedPageRoutes(project: string, prefix = ''): Promise<string[]> {
  const docsRoot = path.join(projectRoot, 'site', prefix, project, 'docs');
  const routes: string[] = [];

  for (const file of await importedPages(docsRoot)) {
    const localePrefix = prefix === '' ? '' : `${prefix}/`;
    routes.push(`/${localePrefix}${project}/docs/${file.replace(/\.md$/u, '')}/`);
  }

  return routes;
}

/** Category index routes that exist for a project, read from the imported tree. */
async function categoryRoutes(slug: string): Promise<string[]> {
  const routes: string[] = [];

  for (const prefix of ['', 'en']) {
    const docsRoot = path.join(projectRoot, 'site', prefix, slug, 'docs');
    const directory = path.join(docsRoot, 'development');

    if (await exists(path.join(directory, 'index.md'))) {
      routes.push(`/${prefix ? `${prefix}/` : ''}${slug}/docs/development/`);
    }
  }

  return routes;
}

/** Imported documentation pages, relative to a subsite's docs directory. */
async function importedPages(directory: string, prefix = ''): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }

  const found: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      found.push(...(await importedPages(path.join(directory, entry.name), `${prefix}${entry.name}/`)));
      continue;
    }

    if (entry.name.endsWith('.md') && entry.name !== 'index.md') {
      found.push(`${prefix}${entry.name}`);
    }
  }

  return found;
}

async function routeExists(route: string): Promise<boolean> {
  const routePath = decodeURIComponent(new URL(route, 'https://poppy.test').pathname);
  const segments = routePath.split('/').filter(Boolean);
  const routeFile = path.join(outputRoot, ...segments);

  const candidates = routePath.endsWith('/')
    ? [path.join(routeFile, 'index.html'), `${routeFile}.html`]
    : [routeFile.endsWith('.html') ? routeFile : `${routeFile}.html`];

  for (const candidate of candidates) {
    if (await exists(candidate)) {
      return true;
    }
  }

  return false;
}

async function exists(target: string): Promise<boolean> {
  try {
    await stat(target);

    return true;
  } catch {
    return false;
  }
}

async function findHtmlFiles(directory = outputRoot): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return findHtmlFiles(entryPath);
      }

      return entry.name.endsWith('.html') ? [entryPath] : [];
    }),
  );

  return nested.flat();
}

function routeForOutputFile(filePath: string): string {
  const relative = path.relative(outputRoot, filePath).split(path.sep).join('/');
  const routePath = `/${relative}`;

  if (relative === 'index.html') {
    return '/';
  }

  return routePath.endsWith('/index.html') ? routePath.slice(0, -'index.html'.length) : routePath;
}

/**
 * VitePress emits `index.html` for directory routes and a flat `<slug>.html`
 * for leaf pages, so a directory link has to be checked in both forms.
 */
function localTargetFiles(routePath: string): string[] {
  const decoded = decodeURIComponent(routePath);
  const segments = decoded.split('/').filter(Boolean);
  const resolved = path.resolve(outputRoot, ...segments);
  const relative = path.relative(outputRoot, resolved);

  assert.ok(
    relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative)),
    `Internal link escapes the static output directory: ${routePath}`,
  );

  if (decoded.endsWith('/') || segments.length === 0) {
    return [path.join(resolved, 'index.html'), `${resolved}.html`];
  }

  return resolved.endsWith('.html') ? [resolved] : [resolved, `${resolved}.html`];
}

async function localTargetExists(routePath: string): Promise<boolean> {
  for (const candidate of localTargetFiles(routePath)) {
    if (await exists(candidate)) {
      return true;
    }
  }

  return false;
}

const projectSlugs = projects.map((project) => project.slug);

describe('routes', () => {
  test('builds the home, project, blog, and documentation routes in both locales', async () => {
    const expectedRoutes = [
      '/',
      '/en/',
      '/blog/',
      '/en/blog/',
      '/blog/um-arquivo-com-origem/',
      '/en/blog/a-source-aware-archive/',
      '/404.html',
      ...projectSlugs.flatMap((slug) => [`/projects/${slug}/`, `/en/projects/${slug}/`]),
      ...projectSlugs.flatMap((slug) => [
        `/${slug}/docs/`,
        `/en/${slug}/docs/`,
      ]),
    ];

    // A category index exists only where that category has pages in that
    // locale, so those routes are read from the imported tree.
    for (const slug of projectSlugs) {
      expectedRoutes.push(...(await categoryRoutes(slug)));
    }

    for (const route of expectedRoutes) {
      expect(await routeExists(route), `missing route ${route}`).toBe(true);
    }

    // Every imported page has to be reachable, which is what makes the
    // criterion-derived import verifiable.
    for (const project of projectSlugs) {
      for (const prefix of ['', 'en']) {
        const directory = path.join(projectRoot, 'site', prefix, project, 'docs');

        for (const file of await importedPages(directory)) {
          const localePrefix = prefix === '' ? '' : `${prefix}/`;
          const route = `/${localePrefix}${project}/docs/${file.replace(/\.md$/u, '')}/`;

          expect(await routeExists(route), `imported page has no route: ${route}`).toBe(true);
        }
      }
    }
  });

  test('keeps project and blog content available in Portuguese and English', async () => {
    expect(await readRoute('/')).toMatch('Ideias que');
    expect(await readRoute('/en/')).toMatch('Ideas that');

    for (const slug of projectSlugs) {
      expect(await readRoute(`/projects/${slug}/`)).toContain(`/${slug}/docs/`);
      expect(await readRoute(`/en/projects/${slug}/`)).toContain(`/en/${slug}/docs/`);
    }

    expect(await readRoute('/blog/um-arquivo-com-origem/')).toMatch('Um arquivo com origem');
    expect(await readRoute('/en/blog/a-source-aware-archive/')).toMatch('An archive with provenance');
  });

  test('redirects every old /docs/<project>/ link to the page that replaced it', async () => {
    const redirects = await vercelRedirects();

    for (const slug of projectSlugs) {
      for (const prefix of ['', 'en']) {
        const localePrefix = prefix === '' ? '' : `/${prefix}`;
        const directory = path.join(projectRoot, 'site', prefix, slug, 'docs');
        const pages = (await importedPages(directory)).map((file) => file.replace(/\.md$/u, ''));

        for (const page of ['', ...pages]) {
          const oldRoute = `${localePrefix}/docs/${slug}${page === '' ? '' : `/${page}`}`;
          const newRoute = `${localePrefix}/${slug}/docs${page === '' ? '' : `/${page}`}`;

          expect(applyRedirects(redirects, oldRoute), `redirect for ${oldRoute}`).toBe(newRoute);
          expect(await routeExists(`${newRoute}/`), `redirect target for ${oldRoute}`).toBe(true);
        }
      }
    }

    // Only known projects move; an unknown name must not become /<name>/docs.
    expect(applyRedirects(redirects, '/docs/unknown/page')).toBeUndefined();
  });
});

interface Redirect {
  source: string;
  destination: string;
}

async function vercelRedirects(): Promise<Redirect[]> {
  const config = JSON.parse(await readFile(path.join(projectRoot, 'vercel.json'), 'utf8'));

  return config.redirects;
}

/**
 * Resolves a path against vercel.json redirects, first match wins. Supports the
 * subset of Vercel's path-to-regexp syntax the file uses: `:name`,
 * `:name(a|b)` and a trailing `:name*`.
 */
function applyRedirects(redirects: Redirect[], route: string): string | undefined {
  for (const { source, destination } of redirects) {
    const names: string[] = [];
    const pattern = source.replace(
      /\/:(\w+)(\([^)]*\))?(\*)?/gu,
      (_match, name: string, group: string | undefined, star: string | undefined) => {
        names.push(name);

        return star ? '(?:/(.*))?' : `/(${group ? group.slice(1, -1) : '[^/]+'})`;
      },
    );
    const match = new RegExp(`^${pattern}$`, 'u').exec(route);

    if (match) {
      return names
        .reduce((result, name, index) => result.replace(`:${name}*`, match[index + 1] ?? '').replace(`:${name}`, match[index + 1] ?? ''), destination)
        .replace(/\/$/u, '');
    }
  }

  return undefined;
}

describe('provenance', () => {
  test('serves the pinned source manifest and complete third-party notices', async () => {
    const manifest = JSON.parse(await readRoute('/sources.json'));
    const notices = await readRoute('/third-party-notices.txt');
    const canonicalNotices = await readFile(path.join(projectRoot, 'THIRD_PARTY_NOTICES.md'), 'utf8');

    expect(manifest.schemaVersion).toBe(3);
    expect(manifest.sources.length).toBe(projectSlugs.length);
    expect(notices).toBe(canonicalNotices);
    expect(notices).toMatch(/MIT License/u);

    for (const source of manifest.sources) {
      for (const page of source.pages) {
        expect(
          await exists(path.join(projectRoot, page.localPath)),
          `manifest references a missing file: ${page.localPath}`,
        ).toBe(true);
      }
    }
  });

  test('pins every vendored page to a real commit and blob', () => {
    for (const source of vendoredDocs) {
      expect(source.revision, `${source.project} has no pinned revision`).toMatch(/^[0-9a-f]{40}$/u);

      for (const page of source.pages) {
        expect(page.sourceBlob, `${source.project}/${page.slug} has no blob`).toMatch(/^[0-9a-f]{40}$/u);

        if (page.englishSourcePath) {
          expect(page.englishSourceBlob, `${source.project}/${page.slug} en blob`).toMatch(
            /^[0-9a-f]{40}$/u,
          );
        }
      }
    }
  });

  test('does not publish an English page that has no translation', async () => {
    for (const project of projectSlugs) {
      const portuguese = await importedPageRoutes(project);

      for (const route of portuguese) {
        const englishRoute = route.replace(/^\//u, '/en/');
        const published = await routeExists(englishRoute);

        if (published) {
          const english = await readRoute(englishRoute);
          const portugueseHtml = await readRoute(route);

          // A published English page has to be a translation, not a copy of
          // the Portuguese one.
          expect(english, `${englishRoute} looks like a copy of the Portuguese page`).not.toBe(
            portugueseHtml,
          );
        }
      }
    }
  });
});

describe('branding', () => {
  test('keeps the dark logo variant geometrically identical to the light one', async () => {
    const lightLogo = await readFile(
      path.join(siteRoot, 'public', 'assets', 'poppy-logo.svg'),
      'utf8',
    );
    const darkLogo = await readFile(
      path.join(siteRoot, 'public', 'assets', 'poppy-logo-dark.svg'),
      'utf8',
    );
    const geometry = (svg: string) =>
      [...svg.matchAll(/\s(?:d|cx|cy|rx|ry)="([^"]*)"/gu)].map((match) => match[1]).join('|');
    const fills = (svg: string) =>
      [...new Set((svg.match(/#[0-9a-f]{6}/giu) ?? []).map((fill) => fill.toLowerCase()))].sort();

    expect(geometry(darkLogo), 'Dark variant must reuse the light geometry').toBe(geometry(lightLogo));
    expect(fills(lightLogo), 'Light variant fills changed').toEqual(['#141313', '#d4b893', '#fefefe']);
    expect(fills(darkLogo), 'Dark variant fills changed').toEqual(['#262a25', '#d4b893', '#f1eddf']);

    const documentationHtml = await readRoute('/ori/docs/');
    expect(documentationHtml).toMatch(/poppy-logo\.svg/u);
    expect(await readRoute('/')).toMatch(/poppy-logo\.svg/u);
  });

  test('renders the site chrome on every generated page', async () => {
    const pages = await findHtmlFiles();

    for (const page of pages) {
      const html = await readFile(page, 'utf8');
      const route = routeForOutputFile(page);

      expect(html, `${route} is missing the site header`).toContain('site-header');
      expect(html, `${route} is missing the site footer`).toContain('site-footer');

      // The project switcher belongs to the documentation; editorial pages
      // link to the projects from their own content instead.
      if (/\/(ori|aipo|oride|prumo)\/docs\//u.test(route)) {
        expect(html, `${route} is missing the project switcher`).toContain('project-switch__link');
      }
    }
  });
});

describe('project integration', () => {
  test('links every project page to its own documentation', async () => {
    for (const project of projects) {
      const html = await readRoute(`/projects/${project.slug}/`);

      for (const route of await importedPageRoutes(project.slug)) {
        expect(html, `${project.slug} page should link to ${route}`).toContain(route);
      }
    }
  });

  test('links every documentation page back to its project and repository', async () => {
    for (const project of projects) {
      for (const route of await importedPageRoutes(project.slug)) {
        const html = await readRoute(route);

        expect(html, `${route} should link back to the project`).toContain(
          `/projects/${project.slug}/`,
        );
        expect(html, `${route} should link to the repository`).toContain(
          project.repositoryHref,
        );
      }
    }
  });

  test('gives every project documentation page its own visual identity', async () => {
    for (const project of projects) {
      const html = await readRoute(`/${project.slug}/docs/`);

      expect(html, `${project.slug} is missing its identity attribute`).toContain(
        `data-project="${project.slug}"`,
      );
    }
  });

  test('offers the project switcher on documentation pages', async () => {
    const html = await readRoute('/oride/docs/guides/user-guide/');

    for (const project of projects) {
      expect(html, `switcher is missing ${project.name}`).toContain(`/${project.slug}/docs/`);
    }
  });
});

describe('bilingual parity', () => {
  test('a page published in both languages is a real translation', async () => {
    let compared = 0;

    for (const project of projectSlugs) {
      for (const route of await importedPageRoutes(project)) {
        const englishRoute = route.replace(/^\//u, '/en/');

        // A project may publish a page in Portuguese only, so the rule applies
        // to the pages that exist in both.
        if (!(await routeExists(englishRoute))) {
          continue;
        }

        compared += 1;

        const portuguese = await readRoute(route);
        const english = await readRoute(englishRoute);

        expect(english, `${englishRoute} looks like a copy of the Portuguese page`).not.toBe(
          portuguese,
        );
      }
    }

    expect(compared, 'nenhuma página existe nos dois idiomas').toBeGreaterThan(0);
  });

  test('every English documentation page has a Portuguese counterpart', async () => {
    for (const project of projects) {
      for (const route of await importedPageRoutes(project.slug)) {
        expect(await routeExists(route), `missing English counterpart for ${route}`).toBe(true);
      }
    }
  });

  test('publishes the same documentation routes in both locales', async () => {
    async function routesUnder(prefix: string): Promise<string[]> {
      const root = path.join(outputRoot, prefix);
      const files = await findHtmlFiles(root);

      return files
        .map((file) => `/${path.relative(root, file).split(path.sep).join('/')}`)
        .filter((route) => route.endsWith('.html'))
        .map((route) => route.replace(/(?<!\/)index\.html$/u, ''))
        .sort();
    }

    const portuguese = await routesUnder('ori/docs');
    const english = await routesUnder(path.join('en', 'ori', 'docs'));

    expect(portuguese.length).toBeGreaterThan(0);
    expect(english).toEqual(portuguese);
  });
});

describe('content safety', () => {
  test('never suggests running a language in the browser', async () => {
    for (const project of projects) {
      const html = await readRoute(`/projects/${project.slug}/`);

      // The note is one element, so tags are stripped before matching.
      const text = html.replace(/<[^>]*>/gu, ' ').replace(/\s+/gu, ' ');

      expect(text, `${project.slug} page should state the sample is not executed`).toMatch(
        /(?:não compila nem executa|não há execução|nada é executado|does not compile or run|nothing runs in the browser|No commands)/iu,
      );
    }
  });

  test('does not publish the internal engineering documentation', async () => {
    const published = await findHtmlFiles();
    const internalDirectories = ['architecture', 'governance', '01-ui', 'security'];

    for (const file of published) {
      const relative = path.relative(outputRoot, file);

      for (const directory of internalDirectories) {
        expect(
          relative.startsWith(`${directory}/`),
          `internal documentation leaked into the build: ${relative}`,
        ).toBe(false);
      }
    }
  });

  test('keeps every vendored page inside the site source tree', () => {
    for (const source of vendoredDocs) {
      for (const page of source.pages) {
        expect(page.sourcePath.startsWith('/')).toBe(false);
        expect(page.slug).toMatch(/^[a-z0-9-]+$/u);
      }
    }
  });
});

describe('links', () => {
  test('all generated internal links resolve to a static output file', async () => {
    const htmlFiles = await findHtmlFiles();
    const linkPattern = /<a\b[^>]*\bhref=(['"])(.*?)\1/giu;

    for (const htmlFile of htmlFiles) {
      const currentRoute = routeForOutputFile(htmlFile);
      const html = await readFile(htmlFile, 'utf8');

      for (const match of html.matchAll(linkPattern)) {
        const href = match[2];

        if (href === undefined) {
          continue;
        }

        const destination = new URL(href.replaceAll('&amp;', '&'), `https://poppy.test${currentRoute}`);

        if (destination.origin !== 'https://poppy.test') {
          continue;
        }

        expect(
          await localTargetExists(destination.pathname),
          `dead internal link: ${destination.pathname} on ${currentRoute}`,
        ).toBe(true);
      }
    }
  });
});

describe('source tree', () => {
  test('keeps vendored documentation inside the VitePress source directory', async () => {
    for (const project of projectSlugs) {
      for (const prefix of ['', 'en']) {
        const docsRoot = path.join(projectRoot, 'site', prefix, project, 'docs');

        for (const file of await importedPages(docsRoot)) {
          const expected = path.join(docsRoot, file);
          const source = await readFile(expected, 'utf8');

          // Every published page records where it came from.
          expect(source, `${expected} has no source path`).toMatch(/^sourcePath:/mu);
          expect(source, `${expected} has no source blob`).toMatch(/^sourceBlob:/mu);
        }
      }
    }
  });

  test('does not keep the retired Astro entry points', async () => {
    for (const retired of [
      'astro.config.mjs',
      'src/content.config.ts',
      'src/pages',
      'src/components',
      'src/styles',
    ]) {
      expect(await exists(path.join(projectRoot, retired)), `${retired} should be gone`).toBe(false);
    }

    expect(await exists(path.join(siteRoot, '.vitepress', 'config.ts'))).toBe(true);
  });
});
