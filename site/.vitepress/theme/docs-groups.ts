import { docsCategories, localeRoot, type Locale } from '@poppy/project-data';
import type { DocsIndexPage } from '../docs-index.ts';

export interface DocsSection {
  slug: string;
  label: string;
  pages: DocsIndexPage[];
}

export interface DocsGroup {
  slug: string;
  label: string;
  description: string;
  href: string;
  count: number;
  sections: DocsSection[];
}

/**
 * A project's pages in one language, by category and then by folder, in the
 * order the sidebar uses. Categories without pages are left out.
 */
export function groupDocs(pages: DocsIndexPage[], project: string, locale: Locale): DocsGroup[] {
  const localePages = pages.filter((page) => page.locale === locale);

  return docsCategories[locale]
    .map((category) => {
      const categoryPages = localePages.filter((page) => page.category === category.slug);
      const slugs = [...new Set(categoryPages.map((page) => page.section))];

      return {
        slug: category.slug,
        label: category.label,
        description: category.description,
        href: `${localeRoot(locale)}/${project}/docs/${category.slug}/`,
        count: categoryPages.length,
        sections: slugs.map((slug) => {
          const sectionPages = categoryPages.filter((page) => page.section === slug);

          return { slug: slug || 'general', label: sectionPages[0]?.sectionLabel ?? slug, pages: sectionPages };
        }),
      };
    })
    .filter((group) => group.count > 0);
}
