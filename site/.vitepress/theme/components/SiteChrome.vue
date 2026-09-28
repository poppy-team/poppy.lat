<script setup lang="ts">
import { computed } from 'vue';
import { useData } from 'vitepress';
import { getProjectBySlug, projects, siteCopy, type Locale } from '@poppy/project-data';
import ProjectSwitcher from './ProjectSwitcher.vue';
import DocsProjectHeader from './DocsProjectHeader.vue';

const { frontmatter, lang, page } = useData();

const locale = computed<Locale>(() => (lang.value.startsWith('en') ? 'en' : 'pt-BR'));
const copy = computed(() => siteCopy[locale.value]);
const root = computed(() => (locale.value === 'en' ? '/en' : ''));

/**
 * The active project drives the visual identity of every documentation page.
 * It is read from frontmatter so a page states its own project explicitly
 * rather than the chrome guessing from the URL.
 */
const activeProject = computed(() => {
  const declared = frontmatter.value.project;

  return typeof declared === 'string' ? getProjectBySlug(declared) : undefined;
});

const projectLinks = computed(() =>
  projects.map((project) => ({
    slug: project.slug,
    name: project.name,
    href: `${root.value}/docs/${project.slug}/`,
    colorToken: project.colorToken,
  })),
);

/**
 * Slugs of the counterpart pages, keyed by translationKey. Journal posts are
 * the one place where the two locales use different slugs, so the counterpart
 * cannot be derived from the path alone.
 */
const counterpartSlugs: Record<string, Record<Locale, string>> = {
  'source-aware-archive': {
    'pt-BR': 'um-arquivo-com-origem',
    en: 'a-source-aware-archive',
  },
};

function counterpartFor(page: { frontmatter: Record<string, unknown> }): string | undefined {
  const key = page.frontmatter.translationKey;

  return typeof key === 'string' ? counterpartSlugs[key]?.[locale.value === 'en' ? 'pt-BR' : 'en'] : undefined;
}

/** Counterpart route in the other locale. */
const counterpartHref = computed(() => {
  // VitePress reports a directory index as `<dir>/index.md`; the emitted
  // route is the directory itself, so the redundant `index` is dropped.
  const relative = page.value.relativePath
    .replace(/(^|\/)index\.md$/u, '$1')
    .replace(/\.md$/u, '/');
  const inEnglish = relative.startsWith('en/');
  const stripped = inEnglish ? relative.slice(2) : relative;

  // The not-found page is published at a single route, so switching language
  // would land on a page that does not exist.
  if (stripped.startsWith('not-found')) {
    return locale.value === 'en' ? '/' : '/en/';
  }

  const otherSlug = counterpartFor(page.value);

  if (otherSlug) {
    const prefix = locale.value === 'en' ? '' : '/en';

    return `${prefix}/blog/${otherSlug}/`;
  }

  // A locale home has no path left after the prefix is removed.
  if (stripped === '' || stripped === '/') {
    return locale.value === 'en' ? '/' : '/en/';
  }

  return locale.value === 'en' ? `/${stripped}` : `/en/${stripped}`;
});
</script>

<template>
  <a class="skip-link" href="#main-content">{{ copy.skipLink }}</a>

  <header class="site-header">
    <a class="wordmark" :href="`${root}/`" aria-label="Poppy Team">
      <img
        class="wordmark__logo"
        src="/assets/poppy-logo.svg"
        alt=""
        width="32"
        height="32"
        decoding="async"
      />
      <span class="wordmark__text">
        <span class="wordmark__name">poppy</span>
        <span class="wordmark__suffix">team / research &amp; tools</span>
      </span>
    </a>

    <nav class="site-nav" :aria-label="copy.navigationLabel">
      <a class="site-nav__link" :href="`${root}/#projects`">{{ copy.navigation.projects }}</a>
      <a class="site-nav__link" :href="`${root}/docs/`">{{ copy.navigation.docs }}</a>
      <a class="site-nav__link" :href="`${root}/blog/`">{{ copy.navigation.blog }}</a>
      <a class="site-nav__link" href="mailto:mail@poppy.lat">{{ copy.navigation.contact }}</a>
      <a
        class="language-switch"
        :href="counterpartHref"
        :lang="locale === 'en' ? 'pt-BR' : 'en'"
        :aria-label="copy.languageLabel"
      >
        {{ copy.languageName }}
      </a>
    </nav>
  </header>

  <ProjectSwitcher :links="projectLinks" :locale="locale" />

  <DocsProjectHeader
    v-if="activeProject"
    :project="activeProject.slug"
    :locale="locale"
  />
</template>
