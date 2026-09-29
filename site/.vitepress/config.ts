import path from 'node:path';
import { defineConfig, type DefaultTheme, type Plugin } from 'vitepress';
import {
  docsCategories,
  localeRoot,
  projects,
  siteCopy,
  type Locale,
} from '@poppy/project-data';
import { docsIndex, docsPageFor, type DocsIndexPage } from './docs-index.ts';

const locales = {
  root: { label: 'Português', lang: 'pt-BR' },
  en: { label: 'English', lang: 'en' },
} satisfies Record<string, { label: string; lang: string }>;

/**
 * A sidebar link in the form VitePress compares against the current page.
 *
 * With `cleanUrls`, a page such as `guides/x.md` is served at `guides/x`, and
 * VitePress marks a sidebar item active, and derives the previous and next
 * links, by comparing that path with the item's link. A trailing slash never
 * matches, which left every page without an active item and sent the pager
 * to the first entry of the whole sidebar.
 */
function sidebarLink(route: string): string {
  return route.replace(/\/$/u, '');
}

function sectionItems(pages: DocsIndexPage[]): DefaultTheme.SidebarItem[] {
  const sections = [...new Set(pages.map((page) => page.section))];
  const link = (page: DocsIndexPage): DefaultTheme.SidebarItem => ({
    text: page.title,
    link: sidebarLink(page.route),
  });

  // A category with a single folder, or none, reads better as a flat list.
  if (sections.length <= 1) {
    return pages.map(link);
  }

  return sections.map((section) => {
    const sectionPages = pages.filter((page) => page.section === section);

    return {
      text: sectionPages[0]?.sectionLabel ?? section,
      collapsed: true,
      items: sectionPages.map(link),
    };
  });
}

/**
 * One sidebar per project, keyed by its documentation root. Each project is
 * its own documentation subsite, so the sidebar and the previous and next
 * links stay inside it rather than running into the next project.
 */
function projectSidebars(locale: Locale): DefaultTheme.SidebarMulti {
  const categories = docsCategories[locale];
  const copy = siteCopy[locale];

  return Object.fromEntries(
    projects.map((project) => {
      const base = `${localeRoot(locale)}/${project.slug}/docs/`;
      const pages = (docsIndex[project.slug] ?? []).filter((page) => page.locale === locale);

      const groups: DefaultTheme.SidebarItem[] = categories
        .map((category) => ({
          text: category.label,
          link: `${base}${category.slug}/`,
          items: sectionItems(pages.filter((page) => page.category === category.slug)),
        }))
        .filter((group) => group.items.length > 0);

      return [
        base,
        [{ text: copy.overviewLabel, link: base }, ...groups],
      ];
    }),
  );
}

/**
 * Serves the enriched documentation index to the theme, which renders in the
 * browser and cannot read the page files itself.
 */
function importedDocsModule(): Plugin {
  const id = 'virtual:imported-docs';

  return {
    name: 'poppy:imported-docs',
    resolveId(source) {
      return source === id ? `\0${id}` : undefined;
    },
    load(resolved) {
      return resolved === `\0${id}`
        ? `export const importedDocs = ${JSON.stringify(docsIndex)};`
        : undefined;
    },
  };
}

/** Labels of the documentation chrome, which VitePress ships in English. */
function themeLabels(locale: Locale): DefaultTheme.Config {
  return locale === 'en'
    ? {
        docFooter: { prev: 'Previous', next: 'Next' },
        outline: { level: [2, 3], label: 'On this page' },
        lastUpdated: { text: 'Last updated', formatOptions: { dateStyle: 'long', forceLocale: true } },
      }
    : {
        docFooter: { prev: 'Anterior', next: 'Próxima' },
        outline: { level: [2, 3], label: 'Nesta página' },
        lastUpdated: { text: 'Atualizado em', formatOptions: { dateStyle: 'long', forceLocale: true } },
        sidebarMenuLabel: 'Menu',
        returnToTopLabel: 'Voltar ao topo',
        darkModeSwitchLabel: 'Aparência',
        lightModeSwitchTitle: 'Mudar para o tema claro',
        darkModeSwitchTitle: 'Mudar para o tema escuro',
        langMenuLabel: 'Mudar idioma',
      };
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
  transformPageData(pageData) {
    // Imported pages carry a title made from their file name; the heading the
    // page opens with is the real one, and it is what the tab should show.
    const indexed = docsPageFor(pageData.relativePath);

    if (indexed) {
      pageData.title = indexed.title;
      pageData.frontmatter.title = indexed.title;
      pageData.description = indexed.description;
      pageData.frontmatter.description = indexed.description;
    }
  },

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
          { text: siteCopy['pt-BR'].navigation.docs, link: '/#docs' },
          { text: siteCopy['pt-BR'].navigation.blog, link: '/blog/' },
        ],
        sidebar: projectSidebars('pt-BR'),
        ...themeLabels('pt-BR'),
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
          { text: siteCopy.en.navigation.docs, link: '/en/#docs' },
          { text: siteCopy.en.navigation.blog, link: '/en/blog/' },
        ],
        sidebar: projectSidebars('en'),
        ...themeLabels('en'),
      },
    },
  },

  themeConfig: {
    logo: { light: '/assets/poppy-logo.svg', dark: '/assets/poppy-logo-dark.svg', alt: '' },
    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: { buttonText: 'Buscar', buttonAriaLabel: 'Buscar na documentação' },
              modal: {
                noResultsText: 'Nenhum resultado para',
                resetButtonTitle: 'Limpar a busca',
                footer: { selectText: 'abrir', navigateText: 'navegar', closeText: 'fechar' },
              },
            },
          },
        },
      },
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/poppy-team' }],
  },

  markdown: {
    lineNumbers: false,
  },

  vite: {
    plugins: [importedDocsModule()],
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
