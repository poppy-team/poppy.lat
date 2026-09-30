import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Every colour palette, in light and dark, has to be readable. The palettes are
 * plain CSS, so the test reads the stylesheets and checks the contrast of the
 * pairs the pages actually use, using the WCAG formula.
 */
const theme = path.join(process.cwd(), 'site', '.vitepress', 'theme');
const read = (file: string) => readFileSync(path.join(theme, file), 'utf8');

type Tokens = Record<string, string>;

function blocks(css: string): { selector: string; tokens: Tokens }[] {
  return [...css.replace(/\/\*[\s\S]*?\*\//gu, '').matchAll(/([^{}]+)\{([^{}]*)\}/gu)].map((match) => ({
    selector: (match[1] ?? '').trim(),
    tokens: Object.fromEntries(
      [...(match[2] ?? '').matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-f]{6})\s*;/giu)].map((token) => [token[1] ?? '', (token[2] ?? '').toLowerCase()]),
    ),
  }));
}

const tokensCss = blocks(read('tokens.css'));
const palettesCss = blocks(read('palettes.css'));

function tokensFor(selector: string, from: { selector: string; tokens: Tokens }[]): Tokens {
  const found = from.find((block) => block.selector === selector);

  if (!found) {
    throw new Error(`No block for ${selector}`);
  }

  return found.tokens;
}

function luminance(hex: string): number {
  const channel = (index: number) => {
    const value = Number.parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16) / 255;

    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];

  return (light + 0.05) / (dark + 0.05);
}

const variants: { name: string; tokens: Tokens }[] = [
  { name: 'poppy claro', tokens: { ...tokensFor(':root', tokensCss), '--surface': '#f1eddf', '--surface-raised': '#f8f5eb', '--surface-sunken': '#e9e4d4', '--text': '#262a25', '--text-soft': '#4b4e46', '--text-muted': '#5f6057', '--accent': '#a33b2c', '--accent-ink': '#7e2d23', '--feature-plane': '#d9e0d3', '--feature-ink': '#33483f' } },
  { name: 'poppy escuro', tokens: tokensFor('.dark', tokensCss) },
  ...['tokyo-night', 'gruvbox', 'nord'].flatMap((id) => [
    { name: `${id} claro`, tokens: tokensFor(`html[data-palette='${id}']`, palettesCss) },
    { name: `${id} escuro`, tokens: tokensFor(`html[data-palette='${id}'].dark`, palettesCss) },
  ]),
];

describe('paletas de cores', () => {
  for (const { name, tokens } of variants) {
    it(`${name}: texto, links e destaques passam no contraste`, () => {
      const t = (key: string): string => {
        const value = tokens[key];

        if (!value) {
          throw new Error(`${name} has no ${key}`);
        }

        return value;
      };
      const pairs: [string, string, string, number][] = [
        ['texto', '--text', '--surface', 7],
        ['texto em cartão', '--text', '--surface-raised', 7],
        ['texto em poço', '--text', '--surface-sunken', 7],
        ['texto suave', '--text-soft', '--surface', 4.5],
        ['texto suave em cartão', '--text-soft', '--surface-raised', 4.5],
        ['texto suave em poço', '--text-soft', '--surface-sunken', 4.5],
        ['texto discreto', '--text-muted', '--surface', 4.5],
        ['texto discreto em cartão', '--text-muted', '--surface-raised', 4.5],
        ['texto discreto em poço', '--text-muted', '--surface-sunken', 4.5],
        ['link', '--accent-ink', '--surface', 4.5],
        ['link em cartão', '--accent-ink', '--surface-raised', 4.5],
        ['link em poço', '--accent-ink', '--surface-sunken', 4.5],
        ['foco', '--accent', '--surface', 3],
        ['destaque', '--feature-ink', '--feature-plane', 4.5],
        ['texto no destaque', '--text', '--feature-plane', 4.5],
        ['botão da aula', '--feature-plane', '--feature-ink', 4.5],
        ['texto discreto no destaque', '--text-muted', '--feature-plane', 4.5],
      ];

      for (const [label, foreground, background, minimum] of pairs) {
        expect(contrast(t(foreground), t(background)), `${name}: ${label}`).toBeGreaterThanOrEqual(minimum);
      }
    });
  }

  it('as cores do código têm contraste sobre o fundo do bloco, em todas as paletas', () => {
    // The colours Shiki's github themes use, after the corrections in custom.css.
    const light = ['#b82535', '#6f42c1', '#005cc5', '#1b6e2f', '#a84500', '#032f62', '#24292e', '#5a636d'];
    const dark = ['#959fa9', '#f97583', '#b392f0', '#79b8ff', '#9ecbff', '#ffab70', '#85e89d', '#e1e4e8'];

    for (const { name, tokens } of variants) {
      const dim = name.endsWith('escuro');
      const source = dim ? (tokens['--surface-sunken'] ?? '') : (tokens['--surface-raised'] ?? '');

      for (const colour of dim ? dark : light) {
        expect(contrast(colour, source), `${name}: ${colour} sobre o bloco de código`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('o seletor de paletas conhece as mesmas paletas do CSS', () => {
    const source = read('palette.ts');
    const ids = [...source.matchAll(/id: '([a-z-]+)'/gu)].map((match) => match[1]);
    const inCss = [...new Set(palettesCss.map((block) => /data-palette='([a-z-]+)'/u.exec(block.selector)?.[1]))];

    expect(ids).toEqual(['poppy', ...inCss]);
  });
});
