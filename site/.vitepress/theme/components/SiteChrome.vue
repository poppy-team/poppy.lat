<script setup lang="ts">
import { computed } from 'vue';
import { useData } from 'vitepress';
import type { Locale } from '@poppy/project-data';
import SiteHeader from './SiteHeader.vue';
import { importedDocs } from 'virtual:imported-docs';

const { frontmatter, lang, page } = useData();

const locale = computed<Locale>(() => (lang.value.startsWith('en') ? 'en' : 'pt-BR'));

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

/**
 * Counterpart route for a documentation page, matched on the page slug rather
 * than on the route, because a project may publish a page in one language and
 * not the other, and the route differs by the locale prefix.
 */
function documentationCounterpart(currentRoute: string, locale: Locale): string | undefined {
  for (const pages of Object.values(importedDocs)) {
    for (const page of pages) {
      if (page.locale !== locale || page.route !== currentRoute) {
        continue;
      }

      const counterpart = pages.find(
        (other) => other.locale !== locale && other.slug === page.slug,
      );

      if (counterpart) {
        return counterpart.route;
      }
    }
  }

  return undefined;
}

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

  // The courses are written in Portuguese first; the English route is a
  // single page that says so, and it links back to the Portuguese landing.
  if (/^\/?(cursos|courses)\//u.test(stripped)) {
    return locale.value === 'en' ? '/cursos/' : '/en/courses/';
  }

  const isDocumentationPage = typeof frontmatter.value.project === 'string';
  const currentRoute = page.value.relativePath
    .replace(/(^|\/)index\.md$/u, '$1')
    .replace(/\.md$/u, '/');
  const documentationMatch = documentationCounterpart(`/${currentRoute}`, locale.value);

  if (isDocumentationPage && documentationMatch) {
    return documentationMatch;
  }

  // A documentation page without a counterpart has no other-language route,
  // so the switch offers the project landing instead of a dead link.
  if (isDocumentationPage) {
    const projectSlug = typeof frontmatter.value.project === 'string' ? frontmatter.value.project : '';

    return projectSlug
      ? `${locale.value === 'en' ? '' : '/en'}/${projectSlug}/docs/`
      : locale.value === 'en'
        ? '/'
        : '/en/';
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
  <SiteHeader :locale="locale" :language-href="counterpartHref" />
</template>
