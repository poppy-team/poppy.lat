import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { projects } from '../packages/project-data/src/projects.ts';
import { getDocsForProject, vendoredDocs } from '../packages/project-data/src/documentation.ts';

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
        `/docs/${slug}/`,
        `/en/docs/${slug}/`,
        // Only categories that actually have pages get an index route.
        ...[...new Set(getDocsForProject(slug).map((page) => page.category))].flatMap((category) => [
          `/docs/${slug}/${category}/`,
          `/en/docs/${slug}/${category}/`,
        ]),
        ...getDocsForProject(slug).flatMap((page) => [
          `/docs/${slug}/${page.category}/${page.slug}/`,
          `/en/docs/${slug}/${page.category}/${page.slug}/`,
        ]),
      ]),
    ];

    for (const route of expectedRoutes) {
      expect(await routeExists(route), `missing route ${route}`).toBe(true);
    }
  });

  test('keeps project and blog content available in Portuguese and English', async () => {
    expect(await readRoute('/')).toMatch('Ideias que');
    expect(await readRoute('/en/')).toMatch('Ideas that');

    for (const slug of projectSlugs) {
      expect(await readRoute(`/projects/${slug}/`)).toContain(`/docs/${slug}/`);
      expect(await readRoute(`/en/projects/${slug}/`)).toContain(`/en/docs/${slug}/`);
    }

    expect(await readRoute('/blog/um-arquivo-com-origem/')).toMatch('Um arquivo com origem');
    expect(await readRoute('/en/blog/a-source-aware-archive/')).toMatch('An archive with provenance');
  });
});

describe('provenance', () => {
  test('serves the pinned source manifest and complete third-party notices', async () => {
    const manifest = JSON.parse(await readRoute('/sources.json'));
    const notices = await readRoute('/third-party-notices.txt');
    const canonicalNotices = await readFile(path.join(projectRoot, 'THIRD_PARTY_NOTICES.md'), 'utf8');

    expect(manifest.schemaVersion).toBe(2);
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

  test('marks pages that have no English source as pending instead of faking one', async () => {
    for (const source of vendoredDocs) {
      for (const page of source.pages) {
        if (page.englishSourcePath) {
          continue;
        }

        const html = await readRoute(`/en/docs/${source.project}/${page.category}/${page.slug}/`);

        expect(html, `${source.project}/${page.slug} should say the translation is pending`).toContain(
          'Translation pending',
        );
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

    const documentationHtml = await readRoute('/docs/ori/');
    expect(documentationHtml).toMatch(/poppy-logo\.svg/u);
    expect(await readRoute('/')).toMatch(/poppy-logo\.svg/u);
  });

  test('renders the site chrome on every generated page', async () => {
    const pages = await findHtmlFiles();

    for (const page of pages) {
      const html = await readFile(page, 'utf8');
      const route = routeForOutputFile(page);

      expect(html, `${route} is missing the site header`).toContain('site-header');
      expect(html, `${route} is missing the project switcher`).toContain('project-switch__link');
      expect(html, `${route} is missing the site footer`).toContain('site-footer');
    }
  });
});

describe('project integration', () => {
  test('links every project page to its own documentation', async () => {
    for (const project of projects) {
      const html = await readRoute(`/projects/${project.slug}/`);

      for (const page of getDocsForProject(project.slug)) {
        expect(
          html,
          `${project.slug} page should link to ${page.slug}`,
        ).toContain(`/docs/${project.slug}/${page.category}/${page.slug}`);
      }
    }
  });

  test('links every documentation page back to its project and repository', async () => {
    for (const project of projects) {
      for (const page of getDocsForProject(project.slug)) {
        const html = await readRoute(
          `/docs/${project.slug}/${page.category}/${page.slug}/`,
        );

        expect(html, `${project.slug}/${page.slug} should link back to the project`).toContain(
          `/projects/${project.slug}/`,
        );
        expect(html, `${project.slug}/${page.slug} should link to the repository`).toContain(
          project.repositoryHref,
        );
      }
    }
  });

  test('gives every project documentation page its own visual identity', async () => {
    for (const project of projects) {
      const html = await readRoute(`/docs/${project.slug}/`);

      expect(html, `${project.slug} is missing its identity attribute`).toContain(
        `data-project="${project.slug}"`,
      );
    }
  });

  test('offers the project switcher on documentation pages', async () => {
    const html = await readRoute('/docs/oride/guides/user-guide/');

    for (const project of projects) {
      expect(html, `switcher is missing ${project.name}`).toContain(`/docs/${project.slug}/`);
    }
  });
});

describe('bilingual parity', () => {
  test('every Portuguese documentation page has an English counterpart', async () => {
    for (const project of projects) {
      for (const page of getDocsForProject(project.slug)) {
        const portuguese = await readRoute(`/docs/${project.slug}/${page.category}/${page.slug}/`);
        const english = await readRoute(`/en/docs/${project.slug}/${page.category}/${page.slug}/`);

        expect(portuguese).not.toBe(english);
        expect(english, `${project.slug}/${page.slug} has no English title`).toContain(
          page.title.en,
        );
      }
    }
  });

  test('every English documentation page has a Portuguese counterpart', async () => {
    for (const project of projects) {
      for (const page of getDocsForProject(project.slug)) {
        expect(
          await routeExists(`/docs/${project.slug}/${page.category}/${page.slug}/`),
        ).toBe(true);
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

    const portuguese = await routesUnder('docs');
    const english = await routesUnder(path.join('en', 'docs'));

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
    for (const source of vendoredDocs) {
      for (const page of source.pages) {
        for (const localePrefix of ['site/docs', 'site/en/docs']) {
          const expected = path.join(
            localePrefix,
            source.project,
            page.category,
            `${page.slug}.md`,
          );

          expect(
            await exists(path.join(projectRoot, expected)),
            `expected imported page at ${expected}`,
          ).toBe(true);
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
