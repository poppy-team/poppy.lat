import { ref } from 'vue';

/**
 * The colour palette the reader picked. "Poppy" is the site's own and needs no
 * attribute; the others set `data-palette` on <html>, which palettes.css reads.
 * The choice is kept in this browser and applied before the page paints by a
 * small script in the head (see config.ts), so there is no flash of the wrong
 * colours. Light or dark is a separate switch that works inside every palette.
 */
export interface Palette {
  id: string;
  name: string;
  hint: string;
  /** Page, text and accent colours in the light and the dark version, for the little preview. */
  light: [string, string, string];
  dark: [string, string, string];
}

export const palettes: Palette[] = [
  { id: 'poppy', name: 'Poppy', hint: 'As cores do site', light: ['#f1eddf', '#262a25', '#a33b2c'], dark: ['#1d211d', '#e9e5d8', '#e58f78'] },
  { id: 'tokyo-night', name: 'Tokyo Night', hint: 'Azul-noite, suave', light: ['#e1e2e7', '#343b58', '#2e7de9'], dark: ['#1a1b26', '#c0caf5', '#7aa2f7'] },
  { id: 'gruvbox', name: 'Gruvbox', hint: 'Quente, tom retrô', light: ['#fbf1c7', '#3c3836', '#af3a03'], dark: ['#282828', '#ebdbb2', '#fe8019'] },
  { id: 'nord', name: 'Nord', hint: 'Gelo e cinza-azulado', light: ['#eceff4', '#2e3440', '#5e81ac'], dark: ['#2e3440', '#eceff4', '#88c0d0'] },
];

export const storageKey = 'poppy.palette';

export const palette = ref('poppy');

function known(id: string | null): id is string {
  return palettes.some((entry) => entry.id === id);
}

function apply(id: string): void {
  if (id === 'poppy') {
    document.documentElement.removeAttribute('data-palette');
  } else {
    document.documentElement.setAttribute('data-palette', id);
  }
}

/** Reads the saved choice. Storage can be blocked or empty; then the site's own palette stays. */
export function initPalette(): void {
  if (typeof document === 'undefined') {
    return;
  }

  try {
    const saved = localStorage.getItem(storageKey);

    palette.value = known(saved) ? saved : 'poppy';
  } catch {
    palette.value = 'poppy';
  }

  apply(palette.value);
}

export function setPalette(id: string): void {
  if (!known(id)) {
    return;
  }

  palette.value = id;
  apply(id);

  try {
    localStorage.setItem(storageKey, id);
  } catch {
    // Not saved, but it still applies until the page is closed.
  }
}
