import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import SiteShell from './layouts/SiteShell.vue';
import ProjectSwitcher from './components/ProjectSwitcher.vue';
import DocsProjectHeader from './components/DocsProjectHeader.vue';
import HomePage from './layouts/HomePage.vue';
import ProjectPage from './layouts/ProjectPage.vue';
import DocsLanding from './layouts/DocsLanding.vue';
import DocsCategoryIndex from './layouts/DocsCategoryIndex.vue';
import BlogIndex from './layouts/BlogIndex.vue';
import ArticlePage from './layouts/ArticlePage.vue';
import NotFound from './layouts/NotFound.vue';
import './tokens.css';
import './custom.css';

/**
 * VitePress resolves a page's `layout` frontmatter against globally registered
 * components, so each custom layout must be registered under the name used in
 * the frontmatter rather than merely exported from this module.
 */
export default {
  extends: DefaultTheme,
  // The default theme's Layout renders the page content; SiteShell wraps it
  // with the Poppy chrome, navigation, and project switcher.
  Layout: SiteShell,
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
