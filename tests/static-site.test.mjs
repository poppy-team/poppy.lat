import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const projectRoot = process.cwd();
const outputRoot = path.join(projectRoot, 'dist');
const supportedProjects = ['ori', 'aipo', 'oride', 'prumo'];
const expectedDocumentationPages = [
  '/docs/',
  '/docs/ori/',
  '/docs/ori/first-project/',
  '/docs/aipo/',
  '/docs/aipo/what-is-aipo/',
  '/docs/aipo/first-program/',
  '/en/docs/',
  '/en/docs/ori/',
  '/en/docs/ori/first-project/',
  '/en/docs/aipo/',
  '/en/docs/aipo/what-is-aipo/',
  '/en/docs/aipo/first-program/',
];

function outputFileForRoute(route) {
  const routePath = decodeURIComponent(new URL(route, 'https://poppy.test').pathname);
  const routeSegments = routePath.split('/').filter(Boolean);
  const routeFile = path.join(outputRoot, ...routeSegments);

  return routePath.endsWith('/') || routeSegments.length === 0
    ? path.join(routeFile, 'index.html')
    : routeFile;
}

async function readRoute(route) {
  return readFile(outputFileForRoute(route), 'utf8');
}

async function findHtmlFiles(directory = outputRoot) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return findHtmlFiles(entryPath);
    }

    return entry.name.endsWith('.html') ? [entryPath] : [];
  }));

  return nestedFiles.flat();
}

function routeForOutputFile(filePath) {
  const relativePath = path.relative(outputRoot, filePath).split(path.sep).join('/');
  const routePath = `/${relativePath}`;

  if (relativePath === 'index.html') {
    return '/';
  }

  return routePath.endsWith('/index.html')
    ? routePath.slice(0, -'index.html'.length)
    : routePath;
}

function localTargetFile(routePath) {
  const decodedPath = decodeURIComponent(routePath);
  const routeSegments = decodedPath.split('/').filter(Boolean);
  const routeFile = path.resolve(outputRoot, ...routeSegments);
  const relativeTarget = path.relative(outputRoot, routeFile);

  assert.ok(
    relativeTarget === '' || (!relativeTarget.startsWith('..') && !path.isAbsolute(relativeTarget)),
    `Internal link escapes the static output directory: ${routePath}`,
  );

  return decodedPath.endsWith('/') || routeSegments.length === 0
    ? path.join(routeFile, 'index.html')
    : routeFile;
}

test('builds the home, project, blog, and documentation routes in both locales', async () => {
  const expectedRoutes = [
    '/',
    '/en/',
    '/blog/',
    '/en/blog/',
    '/blog/um-arquivo-com-origem/',
    '/en/blog/a-source-aware-archive/',
    ...supportedProjects.map((slug) => `/projetos/${slug}/`),
    ...supportedProjects.map((slug) => `/en/projects/${slug}/`),
    ...expectedDocumentationPages,
    '/404.html',
  ];

  for (const route of expectedRoutes) {
    await stat(outputFileForRoute(route));
  }
});

test('keeps project and blog content available in Portuguese and English', async () => {
  const portugueseHome = await readRoute('/');
  const englishHome = await readRoute('/en/');

  assert.match(portugueseHome, /Ideias que/);
  assert.match(englishHome, /Ideas that/);

  for (const slug of supportedProjects) {
    const portugueseProject = await readRoute(`/projetos/${slug}/`);
    const englishProject = await readRoute(`/en/projects/${slug}/`);

    assert.ok(portugueseProject.includes(`/${slug}`), `Missing Portuguese project content: ${slug}`);
    assert.ok(englishProject.includes(`/${slug}`), `Missing English project content: ${slug}`);
  }

  assert.match(await readRoute('/blog/um-arquivo-com-origem/'), /Um arquivo com origem/);
  assert.match(await readRoute('/en/blog/a-source-aware-archive/'), /An archive with provenance/);
});

test('serves the pinned source manifest and complete third-party notices', async () => {
  const sourceManifest = JSON.parse(await readFile(path.join(outputRoot, 'docs', 'sources.json'), 'utf8'));
  const noticeText = await readFile(path.join(outputRoot, 'third-party-notices.md'), 'utf8');
  const canonicalNoticeText = await readFile(path.join(projectRoot, 'THIRD_PARTY_NOTICES.md'), 'utf8');

  assert.equal(sourceManifest.schemaVersion, 1);
  assert.ok(sourceManifest.sources.length > 0);
  assert.equal(noticeText, canonicalNoticeText);
  assert.match(noticeText, /MIT License/u);

  for (const source of sourceManifest.sources) {
    for (const page of source.pages) {
      await stat(path.join(projectRoot, page.localPath));
    }
  }
});

test('keeps the dark logo variant geometrically identical to the light one', async () => {
  const lightLogo = await readFile(path.join(projectRoot, 'src', 'assets', 'poppy-logo.svg'), 'utf8');
  const darkLogo = await readFile(path.join(projectRoot, 'src', 'assets', 'poppy-logo-dark.svg'), 'utf8');
  const geometry = (svg) => [...svg.matchAll(/\s(?:d|cx|cy|rx|ry)="([^"]*)"/g)].map((match) => match[1]).join('|');
  const fills = (svg) => [...new Set((svg.match(/#[0-9a-f]{6}/giu) ?? []).map((fill) => fill.toLowerCase()))].sort();

  assert.equal(geometry(darkLogo), geometry(lightLogo), 'Dark variant must reuse the light geometry');
  assert.deepEqual(fills(lightLogo), ['#141313', '#d4b893', '#fefefe'], 'Light variant fills changed');
  assert.deepEqual(fills(darkLogo), ['#262a25', '#d4b893', '#f1eddf'], 'Dark variant fills changed');

  const documentationHtml = await readRoute('/docs/');
  assert.match(documentationHtml, /poppy-logo-dark\.[^"]+\.svg/u, 'Missing dark logo in the docs header');
  assert.match(documentationHtml, /poppy-logo\.[^"]+\.svg/u, 'Missing light logo in the docs header');
});

test('all generated internal links resolve to a static output file', async () => {
  const htmlFiles = await findHtmlFiles();
  const linkPattern = /<a\b[^>]*\bhref=(['"])(.*?)\1/giu;

  for (const htmlFile of htmlFiles) {
    const currentRoute = routeForOutputFile(htmlFile);
    const html = await readFile(htmlFile, 'utf8');

    for (const [, , href] of html.matchAll(linkPattern)) {
      const destination = new URL(href.replaceAll('&amp;', '&'), `https://poppy.test${currentRoute}`);

      if (destination.origin !== 'https://poppy.test') {
        continue;
      }

      const targetFile = localTargetFile(destination.pathname);
      await stat(targetFile);
    }
  }
});
