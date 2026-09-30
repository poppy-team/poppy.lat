import { z } from 'zod';

/**
 * Text that people write is never trusted. Before it is stored it is
 * normalised (Unicode NFC, Unix line endings) and refused when it carries
 * characters that exist to disguise it: control characters, invisible
 * characters and the ones that flip the direction of text. Emoji, including
 * the ones made of several pieces, are ordinary text.
 */
const invisible =
  /[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F\u00AD\u034F\u061C\u115F-\u1160\u17B4-\u17B5\u180B-\u180F\u200B-\u200C\u200E-\u200F\u202A-\u202E\u2060-\u206F\u3164\uFE00-\uFE0E\uFEFF\uFFA0\u{E0000}-\u{E007F}]/u;

/** U+200D glues emoji into one picture (👩‍💻, ❤️‍🔥). Anywhere else it is an invisible character. */
const strayJoiner =
  /(?<![\p{Extended_Pictographic}\uFE0F\u{1F3FB}-\u{1F3FF}])\u200D|\u200D(?!\p{Extended_Pictographic})/u;

/** Why a text was refused, in words for the person who wrote it. */
export class InvalidText extends Error {}

export function cleanText(input: string, options: { multiline?: boolean } = {}): string {
  const text = input.normalize('NFC').replace(/\r\n?/gu, '\n');

  if (invisible.test(text) || strayJoiner.test(text)) {
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
/** `@nome` and `@nome.com.br` are mentions, not addresses: handles on other networks can have dots. */
const mention = /(?<![\p{L}\p{N}_.@-])@[\p{L}\p{N}_-]+(?:\.[\p{L}\p{N}_-]+)*/gu;

/** True when the text carries a web or e-mail address (a mention such as `@ana.dev` does not count). */
export function containsAddress(value: string): boolean {
  return looksLikeLink.test(value.replace(mention, ' '));
}

export const hasMarkdownImage = /!\[[^\]]*\]\([^)]*\)/u;

/** Escapes % and _ so a search term is matched literally by LIKE ... ESCAPE '\'. */
export function likePattern(term: string): string {
  return `%${term.replace(/[\\%_]/gu, (match) => `\\${match}`)}%`;
}
