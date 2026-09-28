/**
 * Emits docs/sources.json, the public allow-list of vendored documentation.
 *
 * The manifest is generated from packages/project-data/src/documentation.ts so
 * the published file can never drift from the imports the build actually made.
 * Run with: pnpm content, or directly with node --experimental-strip-types.
 */

import { writeFile } from 'node:fs/promises';
import { vendoredDocs } from '../packages/project-data/src/documentation.ts';

interface ManifestPage {
  locale: 'pt-BR' | 'en';
  sourcePath: string;
  sourceBlob: string;
  localPath: string;
  category: string;
  status: 'vendored' | 'translation-pending';
}

const sources = vendoredDocs.map((source) => ({
  project: source.project,
  repository: source.repository,
  revision: source.revision,
  license: source.license,
  licenseFile: source.licenseFile,
  pages: source.pages.flatMap((page): ManifestPage[] => {
    const entries: ManifestPage[] = [
      {
        locale: 'pt-BR',
        sourcePath: page.sourcePath,
        sourceBlob: page.sourceBlob,
        localPath: `site/docs/${source.project}/${page.category}/${page.slug}.md`,
        category: page.category,
        status: 'vendored',
      },
    ];

    if (page.englishSourcePath && page.englishSourceBlob) {
      entries.push({
        locale: 'en',
        sourcePath: page.englishSourcePath,
        sourceBlob: page.englishSourceBlob,
        localPath: `site/en/docs/${source.project}/${page.category}/${page.slug}.md`,
        category: page.category,
        status: 'vendored',
      });
    } else {
      entries.push({
        locale: 'en',
        sourcePath: page.sourcePath,
        sourceBlob: page.sourceBlob,
        localPath: `site/en/docs/${source.project}/${page.category}/${page.slug}.md`,
        category: page.category,
        status: 'translation-pending',
      });
    }

    return entries;
  }),
}));

const manifest = {
  schemaVersion: 2,
  purpose:
    'Allow-list de documentação pública selecionada para cópia estática no site da Poppy Team.',
  canonicality:
    'Os repositórios de origem são as fontes canônicas; as cópias locais não são atualizadas automaticamente.',
  updatedAt: new Date().toISOString().slice(0, 10),
  generator: 'scripts/generate-manifest.ts',
  documentationCategories: {
    guides: 'Conceitos, primeiros passos e referência de uso.',
    roadmap: 'Histórico de versões e planos futuros.',
    development: 'Arquitetura interna e material para quem contribui.',
  },
  siteRoutes: {
    sourceManifest: '/sources.json',
    thirdPartyNotices: '/third-party-notices.md',
  },
  sources,
  excludedAreas: [
    'documentação interna de engenharia e governança dos projetos de origem',
    'specs normativas completas, changelogs parciais, issues e arquivos não listados explicitamente',
    'material de roadmap além do changelog e do plano de cada projeto',
    'qualquer conteúdo de execução, runtime ou playground',
  ],
};

await writeFile('site/public/sources.json', `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const total = sources.reduce((total, source) => total + source.pages.length, 0);

console.log(`sources.json: ${sources.length} projects, ${total} page entries`);
