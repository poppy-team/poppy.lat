import path from 'node:path';
import { defineConfig, type DefaultTheme } from 'vitepress';
import {
  docsCategories,
  getDocsForProject,
  localeRoot,
  projects,
  siteCopy,
  type Locale,
} from '@poppy/project-data';

const locales = {
  root: { label: 'Português', lang: 'pt-BR' },
  en: { label: 'English', lang: 'en' },
} satisfies Record<string, { label: string; lang: string }>;

function projectSidebar(locale: Locale, { includeLanding }: { includeLanding: boolean }): DefaultTheme.SidebarItem[] {
  const categories = docsCategories[locale];

  return projects.map((project) => {
    const pages = getDocsForProject(project.slug);

    const items: DefaultTheme.SidebarItem[] = categories
      .map((category) => {
        const categoryPages = pages.filter((page) => page.category === category.slug);
        const base = `${localeRoot(locale)}/${project.slug}/docs/${category.slug}`;

        return {
          text: category.label,
          items: categoryPages.map((page) => ({
            text: page.title[locale],
            link: `${base}/${page.slug}`,
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

export default defineConfig({
  transformHead({ pageData }) {
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
    ];
  },

  title: 'Poppy Team',
  description: 'Linguagens e ferramentas com atenção à leitura.',
  lang: 'pt-BR',
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: false,

  // Portuguese lives at the root, English under /en — mirrors the previous
  // Astro + Starlight URL scheme so existing links keep resolving.
  locales: {
    root: {
      label: locales.root.label,
      lang: locales.root.lang,
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
      },
    },
  },
});
