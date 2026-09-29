import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { importedDocs } from '../imported-docs.ts';
import { defineConfig, type DefaultTheme, type HeadConfig } from 'vitepress';
import {
  docsCategories,
  localeRoot,
  projects,
  siteCopy,
  type Locale,
} from '@poppy/project-data';

const locales = {
  root: {
    label: 'Português',
    lang: 'pt-BR',
    ogLocale: 'pt_BR',
    description: 'Linguagens e ferramentas com atenção à leitura.',
  },
  en: {
    label: 'English',
    lang: 'en',
    ogLocale: 'en_US',
    description: 'Languages and tools with care for the reader.',
  },
} satisfies Record<string, { label: string; lang: string; ogLocale: string; description: string }>;

/**
 * Open Graph and Twitter card tags for one page. The image path stays relative
 * until the domain is approved; at that point it, `og:url`, and the canonical
 * link can be made absolute together.
 */
function shareTags(relativePath: string, title: string, description: string): HeadConfig[] {
  const locale = relativePath.startsWith('en/') ? locales.en : locales.root;
  const alternate = locale === locales.en ? locales.root : locales.en;
  const image = '/assets/og-image.png';
  const imageAlt = 'Poppy Team';

  return [
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'Poppy Team' }],
    ['meta', { property: 'og:locale', content: locale.ogLocale }],
    ['meta', { property: 'og:locale:alternate', content: alternate.ogLocale }],
    ['meta', { property: 'og:title', content: title }],
    ['meta', { property: 'og:description', content: description }],
    ['meta', { property: 'og:image', content: image }],
    ['meta', { property: 'og:image:type', content: 'image/png' }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { property: 'og:image:alt', content: imageAlt }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: title }],
    ['meta', { name: 'twitter:description', content: description }],
    ['meta', { name: 'twitter:image', content: image }],
    ['meta', { name: 'twitter:image:alt', content: imageAlt }],
  ];
}

function projectSidebar(locale: Locale, { includeLanding }: { includeLanding: boolean }): DefaultTheme.SidebarItem[] {
  const categories = docsCategories[locale];

  return projects.map((project) => {
    // Read from the imported tree, which is the complete set: the declared
    // list in packages/project-data is empty for the projects whose pages come
    // from the upstream criterion.
    const pages = importedDocs[project.slug] ?? [];
    const localePages = pages.filter((page) => page.locale === locale);
    void localePages;

    const items: DefaultTheme.SidebarItem[] = categories
      .map((category) => {
        const categoryPages = localePages.filter((page) => page.category === category.slug);
        const base = `${localeRoot(locale)}/${project.slug}/docs/${category.slug}`;

        return {
          text: category.label,
          items: categoryPages.map((page) => ({
            text: page.title,
            link: page.route,
          })),
        };
      })
      .filter((group) => group.items.length > 0);

    return {
      text: project.name,
      collapsed: true,
      link: `${localeRoot(locale)}/${project.slug}/docs/`,
      items: includeLanding
        ? [{ text: siteCopy[locale].navigation.docs, link: `${localeRoot(locale)}/${project.slug}/docs/` }, ...items]
        : items,
    };
  });
}

/**
 * Page kind is decided from the source path so the same answer is available at
 * build time, in `transformHead`, and at runtime in the theme. Deciding it only
 * in the component would set the marker after hydration, which is too late for
 * a stylesheet rule that hides the documentation chrome.
 */
function pageKind(relativePath: string): 'documentation' | 'editorial' {
  // A documentation page is any page under `<project>/docs/`, in either locale.
  return /(^|\/)(en\/)?(ori|aipo|oride|prumo)\/docs\//u.test(relativePath)
    ? 'documentation'
    : 'editorial';
}

/**
 * Documentation pages read from the imported tree, handed to the theme as site
 * data. The theme renders in the browser, so the filesystem read happens here,
 * at build time, where the import has already run.
 */
function collectImportedDocs(): Record<string, unknown[]> {
  const siteRoot = path.resolve(import.meta.dirname, '..');
  const collected: Record<string, unknown[]> = {};

  for (const project of projects) {
    const entries: unknown[] = [];

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
          route: `/${project.slug}/docs/${route}/`,
          slug: route.split('/').pop(),
          category: read('category') || 'development',
          title: read('title'),
          description: read('description'),
        });
      }
    };

    walk(path.join(siteRoot, project.slug, 'docs'));
    collected[project.slug] = entries;
  }

  return collected;
}

export default defineConfig({
  transformHead({ pageData, title, description }) {
    const project =
      typeof pageData.frontmatter.project === 'string' ? pageData.frontmatter.project : '';

    // VitePress offers no build-time hook for attributes on <html>, and the
    // rules that separate editorial pages from documentation depend on them.
    // An inline script in the head runs before the body renders, so the marker
    // is always set in time; the theme sets it again on client navigation.
    return [
      [
        'script',
        { 'data-page-marker': '' },
        `document.documentElement.dataset.page=${JSON.stringify(pageKind(pageData.relativePath))};` +
          `document.documentElement.dataset.project=${JSON.stringify(project)};`,
      ],
      ...shareTags(pageData.relativePath, title, description),
    ];
  },

  title: 'Poppy Team',
  description: locales.root.description,
  lang: 'pt-BR',
  cleanUrls: true,

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/assets/apple-touch-icon.png' }],
  ],
  lastUpdated: true,
  ignoreDeadLinks: false,

  // Portuguese lives at the root, English under /en — mirrors the previous
  // Astro + Starlight URL scheme so existing links keep resolving.
  locales: {
    root: {
      label: locales.root.label,
      lang: locales.root.lang,
      description: locales.root.description,
      link: '/',
      themeConfig: {
        // The built-in language menu assumes both locales share a path, which
        // is not true for the journal, so the custom switcher is used instead.
        i18nRouting: false,
        nav: [
          { text: siteCopy['pt-BR'].navigation.projects, link: '/#projects' },
          { text: siteCopy['pt-BR'].navigation.docs, link: '/#projects' },
          { text: siteCopy['pt-BR'].navigation.blog, link: '/blog/' },
        ],
        sidebar: projectSidebar('pt-BR', { includeLanding: false }),
        outline: { level: [2, 3] },
      },
    },
    en: {
      label: locales.en.label,
      lang: locales.en.lang,
      description: locales.en.description,
      link: '/en/',
      themeConfig: {
        i18nRouting: false,
        nav: [
          { text: siteCopy.en.navigation.projects, link: '/en/#projects' },
          { text: siteCopy.en.navigation.docs, link: '/en/#projects' },
          { text: siteCopy.en.navigation.blog, link: '/en/blog/' },
        ],
        sidebar: projectSidebar('en', { includeLanding: false }),
        outline: { level: [2, 3] },
      },
    },
  },

  themeConfig: {
    logo: '/assets/poppy-logo.svg',
    search: { provider: 'local' },
    docFooter: { prev: 'Anterior', next: 'Próxima' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/poppy-team' }],
    footer: {
      message: 'Documentação publicada pela Poppy Team.',
      copyright: '© 2026 Poppy Team',
    },
  },

  markdown: {
    lineNumbers: false,
  },

  vite: {
    resolve: {
      alias: {
        '@poppy/project-data': path.resolve(
          import.meta.dirname,
          '../../packages/project-data/src/index.ts',
        ),
        // Generated here so the theme can list the imported pages without
        // reading the filesystem in the browser.
        'virtual:imported-docs': path.resolve(import.meta.dirname, '..', 'imported-docs.ts'),
      },
    },
  },
});
