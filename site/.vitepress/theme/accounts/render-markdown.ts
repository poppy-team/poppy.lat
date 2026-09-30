/**
 * Comments are Markdown written by strangers, so they are drawn in two
 * steps that each refuse what the other might miss: markdown-it with raw HTML
 * turned off (and images, headings and tables disabled), then DOMPurify with a
 * short list of tags and only http(s) links. The result is the only thing ever
 * given to `v-html`. Both libraries load when the first comment is shown.
 */
type Render = (source: string) => string;

let cached: Promise<Render> | undefined;

export function loadRenderer(): Promise<Render> {
  cached ??= (async () => {
    const [{ default: MarkdownIt }, { default: DOMPurify }] = await Promise.all([import('markdown-it'), import('dompurify')]);
    const markdown = new MarkdownIt({ html: false, linkify: true, breaks: true, typographer: false });

    markdown.disable(['image', 'heading', 'lheading', 'table', 'hr']);

    DOMPurify.addHook('afterSanitizeAttributes', (node) => {
      if (node.tagName === 'A') {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer nofollow ugc');
      }
    });

    return (source) =>
      DOMPurify.sanitize(markdown.render(source), {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'code', 'pre', 'blockquote', 'ul', 'ol', 'li', 'a', 'del'],
        ALLOWED_ATTR: ['href', 'target', 'rel'],
        ALLOWED_URI_REGEXP: /^https?:/iu,
      });
  })();

  return cached;
}
