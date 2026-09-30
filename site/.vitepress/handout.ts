/**
 * The apostila: one plain Markdown file per course, with every written lesson
 * in reading order, made at build time from the lesson pages themselves so it
 * can never drift from the site.
 *
 * Lessons are written in VitePress Markdown (containers, code groups, code
 * fence options). The apostila must read well anywhere, in any Markdown
 * editor, printed or fed to a converter later (PDF is planned), so those
 * extensions are turned into ordinary Markdown here: containers become
 * block quotes with a bold title, and a code group becomes one labelled code
 * block after another, so both Ori and Aipo are on the page.
 *
 * Node only. It reads the catalogue that the theme also uses.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { courseTracks, coursesRoot, handoutHref, lessonRoute, type Course } from './theme/data/courses.ts';

const origin = 'https://poppy.lat';

const containerTitles: Record<string, string> = {
  info: 'Nota',
  tip: 'Dica',
  warning: 'Atenção',
  danger: 'Cuidado',
  details: 'Detalhes',
};

const fenceStart = /^(\s*)(`{3,}|~{3,})(.*)$/u;
const containerStart = /^(:{3,})\s*([\w-]+)\s*(.*)$/u;
const containerEnd = /^:{3,}\s*$/u;
const heading = /^(#{1,6})\s+(.*?)\s*#*\s*$/u;

interface Fence {
  marker: string;
  indent: string;
}

/** The language of a fence header such as "ori [Ori]", "ts{1,3}" or "bash:line-numbers", and its label. */
function readFenceInfo(info: string): { language: string; label: string } {
  const label = /\[([^\]]+)\]/u.exec(info)?.[1]?.trim() ?? '';
  const language = info
    .replace(/\[[^\]]*\]/gu, '')
    .replace(/\{[^}]*\}/gu, '')
    .replace(/:[\w-]+(=\d+)?/gu, '')
    .trim()
    .split(/\s+/u)[0] ?? '';

  return { language, label };
}

/** Removes the line markers VitePress reads from code comments, such as "// [!code ++]". */
function cleanCodeLine(line: string): string {
  return line.replace(/\s*(?:\/\/|#|--)\s*\[!code[^\]]*\]\s*$/u, '');
}

/** Site links become absolute, since the file is read away from the site. */
function absoluteLinks(line: string): string {
  return line.replace(/\]\((\/[^)\s]*)\)/gu, (_match, target: string) => `](${origin}${target})`);
}

export interface ConvertedLesson {
  title: string;
  body: string;
}

/**
 * Turns one lesson page into plain Markdown. The first level-1 heading is
 * returned as the title and removed from the body; every other heading moves
 * two levels down, because the lesson sits under a module and a course.
 */
export function convertLesson(source: string): ConvertedLesson {
  let text = source.replace(/\r\n?/gu, '\n');

  if (text.startsWith('---\n')) {
    const end = text.indexOf('\n---', 3);

    text = end >= 0 ? text.slice(end + 4).replace(/^\n/u, '') : text;
  }

  text = text.replace(/^<(script|style)\b[\s\S]*?^<\/\1>\s*$/gmu, '');

  const out: string[] = [];
  let title = '';
  let fence: Fence | undefined;
  // Each open container that is drawn as a block quote adds one level of "> ".
  const containers: { kind: string; quoted: boolean }[] = [];

  const quote = (): string => '> '.repeat(containers.filter((container) => container.quoted).length);
  const push = (line: string): void => {
    const prefix = quote();

    out.push(line === '' ? prefix.trimEnd() : `${prefix}${line}`);
  };

  for (const raw of text.split('\n')) {
    if (fence) {
      const closing = raw.trim();

      if (closing.startsWith(fence.marker) && closing.replace(/[`~]/gu, '') === '') {
        push(`${fence.indent}${fence.marker}`);
        fence = undefined;
      } else {
        push(cleanCodeLine(raw));
      }

      continue;
    }

    const opening = fenceStart.exec(raw);

    if (opening) {
      const indent = opening[1] ?? '';
      const marker = opening[2] ?? '```';
      const { language, label } = readFenceInfo(opening[3] ?? '');

      if (label) {
        push(`**${label}**`);
        push('');
      }

      push(`${indent}${marker}${language}`);
      fence = { marker, indent };

      continue;
    }

    if (containerEnd.test(raw)) {
      containers.pop();
      push('');

      continue;
    }

    const container = containerStart.exec(raw);

    if (container) {
      const kind = container[2] ?? '';

      if (kind === 'code-group') {
        containers.push({ kind, quoted: false });
      } else {
        const boxTitle = (container[3] ?? '').trim() || containerTitles[kind] || 'Nota';

        containers.push({ kind, quoted: true });
        push(`**${boxTitle}**`);
        push('');
      }

      continue;
    }

    const found = heading.exec(raw);

    if (found) {
      const level = (found[1] ?? '#').length;
      const words = found[2] ?? '';

      if (level === 1 && !title) {
        title = words;

        continue;
      }

      push(`${'#'.repeat(Math.min(level + 2, 6))} ${words}`);

      continue;
    }

    push(absoluteLinks(raw));
  }

  const body = out
    .join('\n')
    .replace(/\n{3,}/gu, '\n\n')
    .trim();

  return { title, body };
}

export interface HandoutOptions {
  /** ISO date shown in the note at the top. */
  date: string;
  /** Returns the source of a lesson page, or undefined when there is none. */
  read: (course: Course, moduleSlug: string, lessonSlug: string) => string | undefined;
}

const languageNames = { ori: 'Ori', aipo: 'Aipo' } as const;

/** The whole apostila of a course, or undefined when nothing is written yet. */
export function buildHandout(course: Course, options: HandoutOptions): string | undefined {
  const written = course.modules
    .map((module) => ({
      module,
      lessons: module.lessons.flatMap((lesson, index) => {
        if (lesson.status !== 'available') {
          return [];
        }

        const source = options.read(course, module.slug, lesson.slug);

        return source === undefined ? [] : [{ lesson, position: index + 1, converted: convertLesson(source) }];
      }),
    }))
    .filter(({ lessons }) => lessons.length > 0);

  if (written.length === 0) {
    return undefined;
  }

  const lines: string[] = [
    `# ${course.title}`,
    '',
    `> ${course.summary}`,
    '>',
    `> Apostila do curso, gerada de ${origin}${coursesRoot}/ em ${options.date}. A versão do site é sempre a mais atual.`,
    `> Linguagens: ${course.languages.map((language) => languageNames[language]).join(' e ')}. Para quem: ${course.audience}.`,
    '',
    '## Sumário',
    '',
  ];

  course.modules.forEach((module, moduleIndex) => {
    lines.push(`${moduleIndex + 1}. **${module.title}**. Projeto: ${module.project}`);

    if (module.lessons.length === 0) {
      lines.push('   - em preparação');
    }

    for (const lesson of module.lessons) {
      const state = lesson.status === 'available' ? `${lesson.minutes} min` : 'em breve';

      lines.push(`   - ${lesson.title} (${state})`);
    }
  });

  written.forEach(({ module, lessons }) => {
    const moduleIndex = course.modules.indexOf(module) + 1;

    lines.push('', '---', '', `## ${moduleIndex}. ${module.title}`, '', `**Projeto do módulo:** ${module.project}`);

    for (const { lesson, position, converted } of lessons) {
      lines.push(
        '',
        `### Lição ${position}: ${converted.title || lesson.title}`,
        '',
        `*Cerca de ${lesson.minutes} min. Versão online: ${origin}${lessonRoute(course, module, lesson)}*`,
        '',
        converted.body,
      );
    }
  });

  lines.push('', '---', '', `Fim da apostila. Dúvidas, correções e ideias: ${origin}${coursesRoot}/`, '');

  return lines.join('\n');
}

/** Reads lesson pages from the `site` directory, where the Markdown files live. */
export function readLessonFrom(siteDirectory: string): HandoutOptions['read'] {
  return (course, moduleSlug, lessonSlug) => {
    try {
      return readFileSync(path.join(siteDirectory, 'aprender', course.slug, moduleSlug, `${lessonSlug}.md`), 'utf8');
    } catch {
      return undefined;
    }
  };
}

export interface BuiltHandout {
  course: Course;
  /** The route it is served at, such as "/apostilas/pensar-em-codigo.md". */
  href: string;
  markdown: string;
}

/** The apostila of every course that has at least one written lesson. */
export function buildAllHandouts(siteDirectory: string, date: string): BuiltHandout[] {
  const read = readLessonFrom(siteDirectory);

  return courseTracks
    .flatMap((track) => track.courses)
    .flatMap((course) => {
      const markdown = buildHandout(course, { date, read });

      return markdown === undefined ? [] : [{ course, href: handoutHref(course), markdown }];
    });
}
