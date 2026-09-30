/**
 * What a person types into the link box, turned into an address a note may
 * carry. Only web and mail addresses are accepted, so a note can never hold a
 * `javascript:` or `data:` link. A bare `exemplo.com` becomes `https://`, an
 * address with an `@` and no scheme becomes `mailto:`. Returns null when the
 * text is not a usable address.
 */
export function normalizeLink(input: string): string | null {
  const text = input.trim();

  if (!text || /\s/u.test(text)) {
    return null;
  }

  const scheme = /^([a-z][a-z0-9+.-]*):/iu.exec(text)?.[1]?.toLowerCase();

  if (scheme) {
    // `localhost:3000` and `exemplo.com:8080` look like a scheme but are hosts.
    if (scheme !== 'http' && scheme !== 'https' && scheme !== 'mailto') {
      return /^[\w.-]+:\d+(\/|$)/u.test(text) ? asWebAddress(`https://${text}`) : null;
    }

    return scheme === 'mailto' ? (/^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/iu.test(text) ? text : null) : asWebAddress(text);
  }

  if (/^[^@/\s]+@[^@/\s]+\.[^@/\s]+$/u.test(text)) {
    return `mailto:${text}`;
  }

  return asWebAddress(`https://${text}`);
}

function asWebAddress(text: string): string | null {
  try {
    const url = new URL(text);

    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.includes('.') || url.hostname === 'localhost' ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Words in a piece of Markdown, close enough for a counter under the editor. */
export function countWords(markdown: string): number {
  const plain = markdown
    .replace(/```[\s\S]*?```/gu, ' ')
    .replace(/[`*_>#~[\]()!|-]/gu, ' ')
    .trim();

  return plain ? plain.split(/\s+/u).filter((word) => /[\p{L}\p{N}]/u.test(word)).length : 0;
}

/**
 * The editor writes an empty paragraph as a line holding `&nbsp;`. In Markdown
 * a blank line already separates paragraphs, so those lines are dropped (code
 * blocks are left exactly as typed) and runs of blank lines shrink to one.
 */
export function tidyMarkdown(markdown: string): string {
  return markdown
    .split(/(```[\s\S]*?```)/u)
    .map((part, index) =>
      index % 2 === 1
        ? part
        : part
            .replace(/^[ \t]*&nbsp;[ \t]*$/gmu, '')
            .replace(/\n{3,}/gu, '\n\n'),
    )
    .join('')
    .replace(/\n+$/u, '\n');
}
