declare module 'virtual:imported-docs' {
  import type { DocsIndexPage } from '../docs-index.ts';

  /** The imported documentation index, enriched at build time by the site config. */
  export const importedDocs: Record<string, DocsIndexPage[]>;
}

/** Stylesheets are imported for their side effect and bundled by Vite. */
declare module '*.css';
