import { computed } from 'vue';
import { useData } from 'vitepress';
import type { Locale } from '@poppy/project-data';
import { importedDocs } from 'virtual:imported-docs';

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

/** A route without its locale prefix, so the two trees can be compared. */
function withoutLocale(route: string): string {
  return route.replace(/^\/en(?=\/)/u, '');
}

/**
 * Counterpart route for a documentation page. Both trees mirror each other
 * below the locale prefix, so the same route in the other locale is the
 * counterpart; a page published in one language only has none.
 */
function documentationCounterpart(currentRoute: string, locale: Locale): string | undefined {
  const target = withoutLocale(currentRoute);

  for (const pages of Object.values(importedDocs)) {
    const counterpart = pages.find(
      (page) => page.locale !== locale && withoutLocale(page.route) === target,
    );

    if (counterpart) {
      return counterpart.route;
    }
  }

  return undefined;
}

/**
 * The reader's locale and the route of the current page in the other locale,
 * which is where the language switch leads.
 */
export function useCounterpart() {
  const { frontmatter, lang, page } = useData();

  const locale = computed<Locale>(() => (lang.value.startsWith('en') ? 'en' : 'pt-BR'));

  function counterpartFor(): string | undefined {
    const key = frontmatter.value.translationKey;

    return typeof key === 'string'
      ? counterpartSlugs[key]?.[locale.value === 'en' ? 'pt-BR' : 'en']
      : undefined;
  }

  const counterpartHref = computed(() => {
    // VitePress reports a directory index as `<dir>/index.md`; the emitted
    // route is the directory itself, so the redundant `index` is dropped.
    const relative = page.value.relativePath
      .replace(/(^|\/)index\.md$/u, '$1')
      .replace(/\.md$/u, '/');
    const inEnglish = relative.startsWith('en/');
    const stripped = inEnglish ? relative.slice('en/'.length) : relative;

    // The not-found page is published at a single route, so switching language
    // would land on a page that does not exist.
    if (stripped.startsWith('not-found')) {
      return locale.value === 'en' ? '/' : '/en/';
    }

    // A project's editorial page carries `project` in its front matter too, so
    // the path decides: only pages under `<project>/docs/` are documentation.
    const isDocumentationPage = /^(ori|aipo|oride|prumo)\/docs\//u.test(stripped);
    const documentationMatch = isDocumentationPage
      ? documentationCounterpart(`/${relative}`, locale.value)
      : undefined;

    if (documentationMatch) {
      return documentationMatch;
    }

    // A documentation page without a counterpart has no other-language route,
    // so the switch offers the project landing instead of a dead link.
    if (isDocumentationPage) {
      const projectSlug = stripped.split('/')[0] ?? '';

      return `${locale.value === 'en' ? '' : '/en'}/${projectSlug}/docs/`;
    }

    const otherSlug = counterpartFor();

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

  return { locale, counterpartHref };
}
