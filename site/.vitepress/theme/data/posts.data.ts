import { createContentLoader } from 'vitepress';
import type { Locale } from '@poppy/project-data';

export interface JournalPost {
  url: string;
  title: string;
  description: string;
  date: string;
  locale: Locale;
}

declare const data: JournalPost[];
export { data };

/** YAML reads a bare date as a Date; the layouts want the ISO day. */
function isoDate(value: unknown): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? '');
}

/** Journal notes in both languages, newest first, read at build time. */
export default createContentLoader(['blog/*.md', 'en/blog/*.md'], {
  transform(raw): JournalPost[] {
    return raw
      .filter((post) => post.frontmatter.layout === 'article')
      .map((post) => ({
        url: post.url,
        title: String(post.frontmatter.title ?? ''),
        description: String(post.frontmatter.description ?? ''),
        date: isoDate(post.frontmatter.pubDate),
        locale: post.frontmatter.locale === 'en' ? ('en' as const) : ('pt-BR' as const),
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  },
});
