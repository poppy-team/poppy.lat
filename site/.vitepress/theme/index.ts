import { defineComponent, h } from 'vue';
import { useData, type Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import ProjectSwitcher from './components/ProjectSwitcher.vue';
import DocsProjectHeader from './components/DocsProjectHeader.vue';
import HomePage from './layouts/HomePage.vue';
import ProjectPage from './layouts/ProjectPage.vue';
import DocsLanding from './layouts/DocsLanding.vue';
import DocsCategoryIndex from './layouts/DocsCategoryIndex.vue';
import BlogIndex from './layouts/BlogIndex.vue';
import ArticlePage from './layouts/ArticlePage.vue';
import NotFound from './layouts/NotFound.vue';
import SiteChrome from './components/SiteChrome.vue';
import SiteFooter from './components/SiteFooter.vue';
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
    const { frontmatter, page } = useData();

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
          h('a', { class: 'skip-link', href: '#main-content' }, 'Pular para o conteúdo'),
          h(SiteChrome),
          h(SiteFooter),
        ],
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
