import type { Locale } from '@poppy/project-data';

/** A journal date as the reader's language writes it, e.g. 28 de setembro de 2026. */
export function formatDate(iso: string, locale: Locale): string {
  if (!iso) {
    return '';
  }

  return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(iso));
}

/** "1 página" / "24 páginas", in the reader's language. */
export function pageCount(count: number, locale: Locale): string {
  if (locale === 'en') {
    return `${count} ${count === 1 ? 'page' : 'pages'}`;
  }

  return `${count} ${count === 1 ? 'página' : 'páginas'}`;
}
