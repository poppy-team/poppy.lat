import { defineComponent, h } from 'vue';
import { useData, type Theme } from 'vitepress';
import { siteCopy } from '@poppy/project-data';
import DefaultTheme from 'vitepress/theme';
import ProjectSwitcher from './components/ProjectSwitcher.vue';
import DocsProjectHeader from './components/DocsProjectHeader.vue';
import DocsBar from './components/DocsBar.vue';
import HomePage from './layouts/HomePage.vue';
import ProjectPage from './layouts/ProjectPage.vue';
import DocsLanding from './layouts/DocsLanding.vue';
import DocsCategoryIndex from './layouts/DocsCategoryIndex.vue';
import BlogIndex from './layouts/BlogIndex.vue';
import ArticlePage from './layouts/ArticlePage.vue';
import NotFound from './layouts/NotFound.vue';
import SiteChrome from './components/SiteChrome.vue';
import LanguageSwitch from './components/LanguageSwitch.vue';
import SiteFooter from './components/SiteFooter.vue';
import '@fontsource-variable/newsreader/opsz.css';
import '@fontsource-variable/newsreader/opsz-italic.css';
import '@fontsource-variable/inter/index.css';
import '@fontsource-variable/jetbrains-mono/index.css';
import './tokens.css';
import './custom.css';

const { Layout } = DefaultTheme;

/**
 * The VitePress default Layout is kept for every page because it is what
 * resolves a page's `layout` frontmatter — replacing it with a router of our
 * own leaves every page body empty.
 *
 * Editorial pages and documentation pages therefore share the shell, and the
 * documentation chrome is shown or hidden by a marker on the document element
 * that the stylesheet interprets, rather than by swapping layouts.
 */
/**
 * Mirrors the page-kind decision made in the site config, so the marker stays
 * correct after client-side navigation.
 */
function pageKind(relativePath: string): 'documentation' | 'editorial' {
  // A documentation page is any page under `<project>/docs/`, in either locale.
  return /(^|\/)(en\/)?(ori|aipo|oride|prumo)\/docs\//u.test(relativePath)
    ? 'documentation'
    : 'editorial';
}

const RoutedLayout = defineComponent({
  name: 'RoutedLayout',
  setup() {
    const { frontmatter, page, lang } = useData();

    return () => {
      const kind = pageKind(page.value.relativePath);
      const project = typeof frontmatter.value.project === 'string' ? frontmatter.value.project : '';

      if (typeof document !== 'undefined') {
        document.documentElement.dataset.project = project;
        document.documentElement.dataset.page = kind;
      }

      return h(Layout, null, {
        // layout-top and layout-bottom are emitted outside the page content, so
        // they fire for the built-in doc layout, for a custom one, and for the
        // not-found page alike. The other slots each cover only one of those.
        'layout-top': () => [
          h(
            'a',
            { class: 'skip-link', href: '#main-content' },
            siteCopy[lang.value.startsWith('en') ? 'en' : 'pt-BR'].skipLink,
          ),
          h(SiteChrome),
          h(SiteFooter),
        ],
        // Imported pages get the project bar at the top of the content column,
        // so it lines up with the text instead of spanning the sidebar. The
        // landing and category pages render it themselves.
        'doc-before': () => (kind === 'documentation' ? [h(DocsBar)] : []),
        // The default theme's language menu leads to the other locale's home
        // and forgets the choice; the site's own switch goes to the same page
        // and remembers it, so it replaces the menu in the documentation bar.
        'nav-bar-content-after': () => (kind === 'documentation' ? [h(LanguageSwitch)] : []),
        'nav-screen-content-after': () =>
          kind === 'documentation' ? [h('div', { class: 'nav-screen-language' }, [h(LanguageSwitch)])] : [],
      });
    };
  },
});

export default {
  extends: DefaultTheme,
  Layout: RoutedLayout,
  enhanceApp({ app }) {
    app.component('ProjectSwitcher', ProjectSwitcher);
    app.component('DocsProjectHeader', DocsProjectHeader);
    app.component('site-home', HomePage);
    app.component('project-page', ProjectPage);
    app.component('docs-landing', DocsLanding);
    app.component('docs-category', DocsCategoryIndex);
    app.component('blog-index', BlogIndex);
    app.component('article', ArticlePage);
    app.component('not-found', NotFound);
  },
} satisfies Theme;
