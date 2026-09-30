import { z } from 'zod';

/**
 * Text that people write is never trusted. Before it is stored it is
 * normalised (Unicode NFC, Unix line endings) and refused when it carries
 * characters that exist to disguise it: control characters, invisible
 * characters and the ones that flip the direction of text.
 */
const invisible = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F­͏؜ᅟᅠ឴឵᠋-᠏​-‏‪-‮⁠-⁯ㅤ︀-︎﻿ﾠ]/u;

/** Why a text was refused, in words for the person who wrote it. */
export class InvalidText extends Error {}

export function cleanText(input: string, options: { multiline?: boolean } = {}): string {
  const text = input.normalize('NFC').replace(/\r\n?/gu, '\n');

  if (invisible.test(text)) {
    throw new InvalidText('O texto tem caracteres invisíveis ou de controle.');
  }

  if (!options.multiline && /[\n\t]/u.test(text)) {
    throw new InvalidText('Este campo não aceita quebra de linha.');
  }

  return text.trim();
}

/** A zod string that is cleaned first, then measured in characters. */
export function text(min: number, max: number, options: { multiline?: boolean } = {}) {
  return z
    .string()
    .transform((value, ctx) => {
      try {
        return cleanText(value, options);
      } catch (error) {
        ctx.addIssue({ code: 'custom', message: error instanceof InvalidText ? error.message : 'Texto inválido.' });

        return z.NEVER;
      }
    })
    .pipe(z.string().min(min, min === 1 ? 'Escreva alguma coisa.' : `Escreva ao menos ${min} caracteres.`).max(max, `Use no máximo ${max} caracteres.`));
}

export const looksLikeLink = /(?:https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|net|org|io|dev|br|lat|me|app|co)\b)/iu;
export const hasMarkdownImage = /!\[[^\]]*\]\([^)]*\)/u;

/** Escapes % and _ so a search term is matched literally by LIKE ... ESCAPE '\'. */
export function likePattern(term: string): string {
  return `%${term.replace(/[\\%_]/gu, (match) => `\\${match}`)}%`;
}
