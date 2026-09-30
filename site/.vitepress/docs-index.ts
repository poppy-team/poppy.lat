import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Locale } from '@poppy/project-data';
import { importedDocs, type ImportedDocPage } from '../imported-docs.ts';

/**
 * The imported index, read at build time and enriched from each page's own
 * text.
 *
 * The generated index names pages after their file (`Cli Overview`, `Adp 001`)
 * and describes them as `<Project> — <title>`, which is what the sidebar, the
 * pager and the landing cards used to show. The page itself already has a
 * real title in its first heading and a real summary in its first paragraph,
 * so those are read here instead. The generated file stays untouched: it is
 * rewritten by the import.
 */
export interface DocsIndexPage extends ImportedDocPage {
  /** Folder under the category, such as `getting-started`; empty at the top. */
  section: string;
  sectionLabel: string;
}

const siteRoot = path.resolve(import.meta.dirname, '..');

const sectionLabels: Record<string, Record<Locale, string>> = {
  '': { 'pt-BR': 'Geral', en: 'General' },
  'getting-started': { 'pt-BR': 'Primeiros passos', en: 'Getting started' },
  manual: { 'pt-BR': 'Manual', en: 'Manual' },
  language: { 'pt-BR': 'Linguagem', en: 'Language' },
  reference: { 'pt-BR': 'Referência', en: 'Reference' },
  packages: { 'pt-BR': 'Pacotes', en: 'Packages' },
  trajectory: { 'pt-BR': 'Trajetória', en: 'Trajectory' },
  tools: { 'pt-BR': 'Ferramentas', en: 'Tools' },
  architecture: { 'pt-BR': 'Arquitetura', en: 'Architecture' },
  adp: { 'pt-BR': 'Propostas (ADP)', en: 'Proposals (ADP)' },
  decisions: { 'pt-BR': 'Decisões', en: 'Decisions' },
  governance: { 'pt-BR': 'Governança', en: 'Governance' },
  design: { 'pt-BR': 'Design', en: 'Design' },
  performance: { 'pt-BR': 'Desempenho', en: 'Performance' },
  evidence: { 'pt-BR': 'Evidências', en: 'Evidence' },
  harness: { 'pt-BR': 'Harness', en: 'Harness' },
  workforce: { 'pt-BR': 'Workforce', en: 'Workforce' },
  zoe: { 'pt-BR': 'Zoe', en: 'Zoe' },
};

/** Sections read in this order; anything unlisted follows alphabetically. */
const sectionOrder = [
  '',
  'getting-started',
  'language',
  'manual',
  'reference',
  'tools',
  'packages',
  'trajectory',
  'architecture',
  'decisions',
  'adp',
  'governance',
  'evidence',
  'performance',
  'design',
  'zoe',
  'harness',
  'workforce',
];

/** Pages a newcomer reads first, ahead of the alphabetical rest. */
const leadingSlugs = [/^what-is/u, /^overview$/u, /^installation$/u, /^getting-started$/u, /^install$/u, /^first-/u, /^tour$/u];

function titleCase(slug: string): string {
  return slug.replace(/[-_]+/gu, ' ').replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
}

/** Markdown inline syntax reduced to the words a reader sees. */
function plainText(markdown: string): string {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/gu, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/gu, '$1')
    .replace(/`([^`]*)`/gu, '$1')
    .replace(/(\*\*|__|\*|_)(.+?)\1/gu, '$2')
    .replace(/<[^>]+>/gu, '')
    .replace(/\s+/gu, ' ')
    .trim();
}

function truncate(text: string, limit: number): string {
  if (text.length <= limit) {
    return text;
  }

  const cut = text.slice(0, limit);

  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.—-]+$/u, '')}…`;
}

function readBody(route: string): string {
  try {
    const source = readFileSync(path.join(siteRoot, `${route.replace(/\/$/u, '')}.md`), 'utf8');

    return source
      .replace(/^---\n[\s\S]*?\n---\n/u, '')
      .replace(/^:::[^\n]*\n[\s\S]*?\n:::\n/mu, '');
  } catch {
    return '';
  }
}

function firstHeading(body: string): string {
  const match = body.match(/^#\s+(.+)$/mu);

  return match?.[1] ? plainText(match[1]) : '';
}

/** The first plain paragraph after the title: no list, table, quote or code. */
function firstParagraph(body: string): string {
  const afterTitle = body
    .replace(/^[\s\S]*?^#\s+.+$/mu, '')
    .replace(/^(```|~~~)[\s\S]*?^\1/gmu, '');

  for (const block of afterTitle.split(/\n\s*\n/u)) {
    const trimmed = block.trim();

    if (!trimmed || /^([#>|:\-*+<]|\d+\.)/u.test(trimmed) || /^\*\*[^*]+:?\*\*:?/u.test(trimmed)) {
      continue;
    }

    const text = plainText(trimmed);

    // A lead-in to a list or a status line is not a summary of the page.
    if (text.length > 24 && !text.endsWith(':') && !/^status\b/iu.test(text)) {
      return truncate(text, 150);
    }
  }

  return '';
}

/** The generated description only repeats the project and the title. */
function isPlaceholderDescription(page: ImportedDocPage): boolean {
  return !page.description || / — /u.test(page.description) && page.description.endsWith(page.title);
}

function sectionOf(page: ImportedDocPage): string {
  const afterCategory = page.route.split(`/docs/${page.category}/`)[1] ?? '';
  const parts = afterCategory.replace(/\/$/u, '').split('/');

  return parts.length > 1 ? (parts[0] ?? '') : '';
}

function rank(list: readonly (string | RegExp)[], value: string): number {
  const index = list.findIndex((entry) => (typeof entry === 'string' ? entry === value : entry.test(value)));

  return index === -1 ? list.length : index;
}

function comparePages(a: DocsIndexPage, b: DocsIndexPage): number {
  return (
    rank(sectionOrder, a.section) - rank(sectionOrder, b.section) ||
    a.section.localeCompare(b.section) ||
    rank(leadingSlugs, a.slug) - rank(leadingSlugs, b.slug) ||
    a.slug.localeCompare(b.slug, 'en', { numeric: true, sensitivity: 'base' })
  );
}

function enrich(page: ImportedDocPage): DocsIndexPage {
  const body = readBody(page.route);
  const section = sectionOf(page);

  return {
    ...page,
    title: firstHeading(body) || page.title,
    description: isPlaceholderDescription(page) ? firstParagraph(body) : page.description,
    section,
    sectionLabel: sectionLabels[section]?.[page.locale] ?? titleCase(section),
  };
}

export const docsIndex: Record<string, DocsIndexPage[]> = Object.fromEntries(
  Object.entries(importedDocs).map(([project, pages]) => [project, pages.map(enrich).sort(comparePages)]),
);

/** Enriched entry for a source path such as `aipo/docs/guides/x.md`. */
export function docsPageFor(relativePath: string): DocsIndexPage | undefined {
  const route = `/${relativePath.replace(/\.md$/u, '/')}`;

  for (const pages of Object.values(docsIndex)) {
    const found = pages.find((page) => page.route === route);

    if (found) {
      return found;
    }
  }

  return undefined;
}
