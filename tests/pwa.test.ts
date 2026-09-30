import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/** The site as an installable app: the manifest, its icons, the service worker of the last build. */
const dist = path.join(process.cwd(), 'site', '.vitepress', 'dist');
const read = (file: string) => readFileSync(path.join(dist, file), 'utf8');

function pngSize(file: string): { width: number; height: number } {
  const bytes = readFileSync(path.join(dist, file));

  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

describe('aplicativo instalável', () => {
  const manifest = JSON.parse(read('manifest.webmanifest')) as {
    name: string;
    start_url: string;
    scope: string;
    display: string;
    lang: string;
    icons: { src: string; sizes: string; purpose: string }[];
    shortcuts: { url: string }[];
  };

  it('o manifesto tem o que o navegador exige para oferecer a instalação', () => {
    expect(manifest.name).toBeTruthy();
    expect(manifest.display).toBe('standalone');
    expect(manifest.lang).toBe('pt-BR');
    expect(manifest.start_url.startsWith(manifest.scope)).toBe(true);

    const sizes = manifest.icons.map((icon) => icon.sizes);

    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
    expect(manifest.icons.some((icon) => icon.purpose === 'maskable')).toBe(true);
  });

  it('cada ícone existe e tem o tamanho que o manifesto diz', () => {
    for (const icon of manifest.icons) {
      const [width, height] = icon.sizes.split('x').map(Number);

      expect(pngSize(icon.src.slice(1)), icon.src).toEqual({ width, height });
    }
  });

  it('os atalhos ficam dentro do escopo', () => {
    for (const shortcut of manifest.shortcuts) {
      expect(shortcut.url.startsWith(manifest.scope), shortcut.url).toBe(true);
    }
  });

  it('todas as páginas apontam para o manifesto', () => {
    for (const page of ['index.html', 'aprender/index.html', 'blog/index.html']) {
      expect(read(page), page).toContain('rel="manifest" href="/manifest.webmanifest"');
    }
  });

  it('o service worker sai do build com versão própria e sem tocar na API', () => {
    const worker = read('sw.js');

    expect(worker).not.toContain('__BUILD_VERSION__');
    expect(worker).toMatch(/const VERSION = '[a-z0-9]+';/u);
    expect(worker).toContain("url.pathname.startsWith('/api/')");
    expect(worker).toContain("request.method !== 'GET'");
  });

  it('existe uma página para quando não há conexão', () => {
    expect(read('offline.html')).toContain('Você está sem conexão');
  });
});
