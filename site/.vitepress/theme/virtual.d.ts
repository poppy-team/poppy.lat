declare module 'virtual:imported-docs' {
  import type { DocsIndexPage } from '../docs-index.ts';

  /** The imported documentation index, enriched at build time by the site config. */
  export const importedDocs: Record<string, DocsIndexPage[]>;
}

/** Stylesheets are imported for their side effect and bundled by Vite. */
declare module '*.css';

interface ImportMeta {
  readonly env: {
    /** "1" turns on accounts, notes and comments; leave it unset for the plain static site. */
    readonly VITE_ACCOUNTS?: string;
    readonly PROD: boolean;
  };
}

declare module '*?url' {
  const url: string;
  export default url;
}

declare module 'emoji-picker-element-data/pt/cldr/data.json?url' {
  const url: string;
  export default url;
}
