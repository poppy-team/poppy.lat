import type { Locale } from '@poppy/project-data';

const storageKey = 'poppy-locale';

/**
 * The language the reader chose with the switch, or undefined when they never
 * did. Storage can be unavailable (private windows, blocked site data), and
 * the site must read the same without it, so every access is guarded.
 */
export function preferredLocale(): Locale | undefined {
  try {
    const stored = window.localStorage.getItem(storageKey);

    return stored === 'en' || stored === 'pt-BR' ? stored : undefined;
  } catch {
    return undefined;
  }
}

/** Remembers an explicit choice so later pages and visits open in it. */
export function rememberLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(storageKey, locale);
  } catch {
    // The choice still applies to the page being opened; it is just not kept.
  }
}
