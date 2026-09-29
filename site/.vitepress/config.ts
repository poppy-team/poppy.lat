import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { importedDocs } from '../imported-docs.ts';
import { defineConfig, type DefaultTheme, type MarkdownOptions } from 'vitepress';
import {
  docsCategories,
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

type LanguageInput = NonNullable<MarkdownOptions['languages']>[number];

/**
 * Shiki ships no grammar for Poppy's own languages, so the fences in the
 * imported docs would render uncoloured. The Ori grammar is the one from the
 * ori-lang VS Code extension, at the revision pinned in sources.json; the Aipo
 * grammar is written here from the keyword table in aipo-lexer.
 */
function poppyGrammar(file: string, name: string, displayName: string): LanguageInput {
  const grammar = JSON.parse(
    readFileSync(path.resolve(import.meta.dirname, 'grammars', file), 'utf8'),
  ) as Record<string, unknown>;

  return { ...grammar, name, displayName } as unknown as LanguageInput;
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
    languages: [
      poppyGrammar('aipo.tmLanguage.json', 'aipo', 'Aipo'),
      poppyGrammar('ori.tmLanguage.json', 'ori', 'Ori'),
    ],
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
