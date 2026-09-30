import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  defineConfig,
  type DefaultTheme,
  type HeadConfig,
  type MarkdownOptions,
  type Plugin,
} from 'vitepress';
import {
  docsCategories,
  localeRoot,
  projects,
  siteCopy,
  type Locale,
} from '@poppy/project-data';
import { docsIndex, docsPageFor, type DocsIndexPage } from './docs-index.ts';
import { courseTracks, coursesRoot, lessonRoute } from './theme/data/courses.ts';

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
 * The course sidebar: every course with at least one written lesson, module
 * by module. Lessons not written yet are listed as plain text, so the reader
 * sees what comes next without a link that goes nowhere.
 */
function courseSidebar(): DefaultTheme.SidebarMulti {
  const courses = courseTracks
    .flatMap((track) => track.courses)
    .filter((course) => course.modules.some((module) => module.lessons.some((l) => l.status === 'available')));

  return {
    [`${coursesRoot}/`]: [
      { text: 'Todos os cursos', link: `${coursesRoot}/` },
      ...courses.map((course) => ({
        text: course.title,
        items: course.modules
          .filter((module) => module.lessons.length > 0)
          .map((module) => ({
            text: module.title,
            items: module.lessons.map((lesson) =>
              lesson.status === 'available'
                ? { text: lesson.title, link: lessonRoute(course, module, lesson) }
                : { text: `${lesson.title} (em breve)` },
            ),
          })),
      })),
    ],
  };
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
function pageKind(relativePath: string): 'documentation' | 'course' | 'editorial' {
  // A lesson is any page under `cursos/` other than the course landing.
  if (/^cursos\/(?!index\.md$)/u.test(relativePath)) {
    return 'course';
  }

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
          { text: siteCopy['pt-BR'].navigation.docs, link: '/#docs' },
          { text: siteCopy['pt-BR'].navigation.courses, link: '/cursos/' },
          { text: siteCopy['pt-BR'].navigation.blog, link: '/blog/' },
        ],
        sidebar: { ...projectSidebars('pt-BR'), ...courseSidebar() },
        ...themeLabels('pt-BR'),
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
          { text: siteCopy.en.navigation.docs, link: '/en/#docs' },
          { text: siteCopy.en.navigation.courses, link: '/en/courses/' },
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
    languages: [
      poppyGrammar('aipo.tmLanguage.json', 'aipo', 'Aipo'),
      poppyGrammar('ori.tmLanguage.json', 'ori', 'Ori'),
    ],
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
