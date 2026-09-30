import { lessonAt } from '../data/courses';

export interface NoteFile {
  id: string;
  title: string;
  bodyMd: string;
  lessonId: string | null;
  updatedAt: string | null;
}

/** A file-name-safe version of a title: no accents, no spaces, no symbols. */
export function slugify(text: string): string {
  const slug = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .slice(0, 60);

  return slug || 'anotacao';
}

export function lessonUrl(lessonId: string | null, origin: string): string | null {
  return lessonId ? `${origin}/aprender/${lessonId}` : null;
}

export function lessonTitle(lessonId: string | null): string | null {
  return lessonId ? (lessonAt(`/aprender/${lessonId}`)?.lesson.title ?? null) : null;
}

/**
 * A note as a Markdown file. The front matter keeps the link to the lesson,
 * so the note still points back to where it was written when it is opened in
 * another program.
 */
export function noteToMarkdown(note: NoteFile, origin: string): string {
  const url = lessonUrl(note.lessonId, origin);
  const title = lessonTitle(note.lessonId);
  const lines = ['---', `title: ${JSON.stringify(note.title || 'Sem título')}`];

  if (url) {
    lines.push(`lesson: ${url}`);
  }

  if (title) {
    lines.push(`lesson_title: ${JSON.stringify(title)}`);
  }

  if (note.updatedAt) {
    lines.push(`updated: ${note.updatedAt}`);
  }

  lines.push('---', '', note.bodyMd, '');

  return lines.join('\n');
}

export function noteFileName(note: NoteFile): string {
  return `${slugify(note.title || lessonTitle(note.lessonId) || 'anotacao')}.md`;
}

export function saveFile(name: string, data: Blob): void {
  const url = URL.createObjectURL(data);
  const link = document.createElement('a');

  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadNote(note: NoteFile): void {
  saveFile(noteFileName(note), new Blob([noteToMarkdown(note, location.origin)], { type: 'text/markdown;charset=utf-8' }));
}

/** Every note in one .zip, each as a .md file. The zip library loads only when this is used. */
export async function downloadAll(notes: NoteFile[]): Promise<void> {
  const { zipSync, strToU8 } = await import('fflate');
  const files: Record<string, Uint8Array> = {};
  const used = new Set<string>();

  for (const note of notes) {
    let name = noteFileName(note);

    for (let n = 2; used.has(name); n += 1) {
      name = name.replace(/(-\d+)?\.md$/u, `-${n}.md`);
    }

    used.add(name);
    files[name] = strToU8(noteToMarkdown(note, location.origin));
  }

  saveFile('minhas-anotacoes.zip', new Blob([zipSync(files) as BlobPart], { type: 'application/zip' }));
}
