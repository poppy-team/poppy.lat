import { describe, expect, it } from 'vitest';
import { countWords, normalizeLink, tidyMarkdown } from '../site/.vitepress/theme/accounts/note-link.ts';

describe('normalizeLink', () => {
  it('keeps web addresses and adds https to bare domains', () => {
    expect(normalizeLink('https://poppy.lat/aprender/')).toBe('https://poppy.lat/aprender/');
    expect(normalizeLink('http://exemplo.com')).toBe('http://exemplo.com/');
    expect(normalizeLink('  poppy.lat  ')).toBe('https://poppy.lat/');
    expect(normalizeLink('www.exemplo.com/a?b=1')).toBe('https://www.exemplo.com/a?b=1');
  });

  it('turns an e-mail address into mailto', () => {
    expect(normalizeLink('ana@exemplo.com')).toBe('mailto:ana@exemplo.com');
    expect(normalizeLink('mailto:ana@exemplo.com')).toBe('mailto:ana@exemplo.com');
  });

  it('refuses everything that could run code or is not an address', () => {
    for (const bad of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,<b>x</b>', 'vbscript:x', 'file:///etc/passwd', '', '   ', 'duas palavras', 'semponto', 'mailto:sem-arroba']) {
      expect(normalizeLink(bad), bad).toBeNull();
    }
  });
});

describe('countWords', () => {
  it('counts words and ignores Markdown marks and code blocks', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('# Título\n\nUm **texto** com _ênfase_.')).toBe(5);
    expect(countWords('antes\n```\nlet a = 1\n```\ndepois')).toBe(2);
  });
});

describe('tidyMarkdown', () => {
  it('drops the empty-paragraph placeholder and extra blank lines', () => {
    expect(tidyMarkdown('# A\n\n&nbsp;\n\n&nbsp;\n\ntexto\n\n\n\nfim\n')).toBe('# A\n\ntexto\n\nfim\n');
  });

  it('leaves code blocks exactly as typed', () => {
    const code = 'antes\n\n```\n&nbsp;\n\n\n\nx\n```\n\ndepois\n';

    expect(tidyMarkdown(code)).toBe(code);
  });
});
