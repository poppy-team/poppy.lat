import type { DocsCategory, Locale, ProjectSlug } from './projects.ts';

/**
 * A documentation page vendored from an upstream repository.
 *
 * `sourceBlob` and `revision` are real git object ids, resolved with
 * `git rev-parse`. They exist so the allow-list can prove which upstream state
 * a local copy came from; upstream repositories remain canonical.
 */
export interface VendoredDocPage {
  /** Route slug relative to the project documentation root, without locale. */
  slug: string;
  category: DocsCategory;
  /** Upstream file for the Portuguese copy. */
  sourcePath: string;
  sourceBlob: string;
  /**
   * Upstream file for the English copy. Omitted when the project has no
   * English translation yet, in which case the English route is a stub that
   * points readers at the repository.
   */
  englishSourcePath?: string;
  englishSourceBlob?: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
}

export interface VendoredDocSource {
  project: ProjectSlug;
  repository: string;
  revision: string;
  license: string;
  licenseFile: string;
  pages: VendoredDocPage[];
}

export const ORI_REVISION = '42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f';
export const AIPO_REVISION = 'e9ec458cc39c6da005cd81e959360ec89648b8c7';
export const ORIDE_REVISION = '92a5262d466a8af9527cc49916ae438e217bb0e9';
export const PRUMO_REVISION = '0f643d1c4fa8ac789cee878fbcd035f214f4eb4a';

export const vendoredDocs: VendoredDocSource[] = [
  {
    project: 'ori',
    repository: 'https://github.com/poppy-team/ori-lang',
    revision: ORI_REVISION,
    license: 'MIT',
    licenseFile: 'LICENSE',
    pages: [
      {
        slug: 'first-project',
        category: 'guides',
        sourcePath: 'docs/guides/first-project.pt-BR.md',
        sourceBlob: '7d9e2b408472e1d5d88e2cfb144007aed3c10396',
        englishSourcePath: 'docs/guides/first-project.md',
        englishSourceBlob: '541f14bd446fee2df6c2bcc525a44b8f3550365d',
        title: { 'pt-BR': 'Primeiro projeto e pacotes locais', en: 'First project and local packages' },
        description: {
          'pt-BR': 'Como criar um projeto, declarar pacotes locais e compilar um primeiro programa.',
          en: 'How to create a project, declare local packages, and compile a first program.',
        },
      },
    ],
  },
  {
    project: 'aipo',
    repository: 'https://github.com/poppy-team/aipo-lang',
    revision: AIPO_REVISION,
    license: 'MIT',
    licenseFile: 'LICENSE',
    pages: [
      {
        slug: 'what-is-aipo',
        category: 'guides',
        sourcePath: 'docs/getting-started/what-is-aipo.md',
        sourceBlob: 'b9417f44d84e5ddddfcd9d4c4af51819b755df75',
        englishSourcePath: 'docs/en/getting-started/what-is-aipo.md',
        englishSourceBlob: 'd7e78ce87a0d2b39bc7b39966e51077f09f92bd9',
        title: { 'pt-BR': 'O que é Aipo?', en: 'What is Aipo?' },
        description: {
          'pt-BR': 'Pilares fundamentais: tipagem, contratos, concorrência e destinos de compilação.',
          en: 'Core pillars: typing, contracts, concurrency, and compilation targets.',
        },
      },
      {
        slug: 'first-program',
        category: 'guides',
        sourcePath: 'docs/getting-started/first-program.md',
        sourceBlob: '7914f423d7c025d6c935c154276b6786e507beab',
        englishSourcePath: 'docs/en/getting-started/first-program.md',
        englishSourceBlob: '4ae0190c693fb552243c4d693987240f3479c38b',
        title: { 'pt-BR': 'Seu primeiro programa', en: 'Your first program' },
        description: {
          'pt-BR': 'Escrever, inspecionar o bytecode e compilar um programa para JavaScript.',
          en: 'Write, inspect the bytecode, and compile a program to JavaScript.',
        },
      },
    ],
  },
  {
    project: 'oride',
    repository: 'https://github.com/poppy-team/oride',
    revision: ORIDE_REVISION,
    license: 'MIT',
    licenseFile: 'LICENSE',
    pages: [
      {
        slug: 'user-guide',
        category: 'guides',
        sourcePath: 'docs/guides/pt/guia-de-uso.md',
        sourceBlob: 'a036731bf3aa33027b2e1de7744ef7750c3f3b74',
        englishSourcePath: 'docs/guides/en/user-guide.md',
        englishSourceBlob: '16d1b9ce1f74dc22e8b8d7f01f18297368199892',
        title: { 'pt-BR': 'Guia de uso', en: 'User guide' },
        description: {
          'pt-BR': 'Os recursos do editor de terminal, da árvore de projeto à edição modal.',
          en: 'The terminal editor’s features, from the project tree to modal editing.',
        },
      },
      {
        slug: 'syntax',
        category: 'guides',
        sourcePath: 'docs/guides/pt/syntax.md',
        sourceBlob: '56ff14947f010361ec7b89f3e2b6f9f2dd4fbaac',
        englishSourcePath: 'docs/guides/en/syntax.md',
        englishSourceBlob: 'dc54fbc644d4e80bd6bde923c4db79bb29c233f5',
        title: { 'pt-BR': 'Sintaxe', en: 'Syntax' },
        description: {
          'pt-BR': 'A linguagem de edição usada nos arquivos do projeto.',
          en: 'The editing language used across the project’s files.',
        },
      },
      {
        slug: 'config',
        category: 'guides',
        sourcePath: 'docs/guides/pt/config.md',
        sourceBlob: 'cb14e550722e237f746d2ce16fea63645b704355',
        englishSourcePath: 'docs/guides/en/config.md',
        englishSourceBlob: '5d1ad3b73791a3a05d67cdc8b8303aaf65dba1f5',
        title: { 'pt-BR': 'Configuração', en: 'Configuration' },
        description: {
          'pt-BR': 'Opções do editor, temas e preferências por projeto.',
          en: 'Editor options, themes, and per-project preferences.',
        },
      },
      {
        slug: 'themes',
        category: 'guides',
        sourcePath: 'docs/guides/pt/themes.md',
        sourceBlob: '6cae80573e8f8d72ccc04835af23dfb1cd3093a3',
        englishSourcePath: 'docs/guides/en/themes.md',
        englishSourceBlob: 'e7108264230de59ed952d0eab5b0b9a28ed557ed',
        title: { 'pt-BR': 'Temas', en: 'Themes' },
        description: {
          'pt-BR': 'Como o editor recebe cores e como definir um tema próprio.',
          en: 'How the editor receives colors and how to define a custom theme.',
        },
      },
      {
        slug: 'markdown',
        category: 'guides',
        sourcePath: 'docs/guides/pt/markdown.md',
        sourceBlob: '32674e6bce232e6ca8fc039177f3f6e6cac07446',
        englishSourcePath: 'docs/guides/en/markdown.md',
        englishSourceBlob: 'c871b2d50535ddf415ec663012a35b6ef559cbd8',
        title: { 'pt-BR': 'Markdown', en: 'Markdown' },
        description: {
          'pt-BR': 'Suporte a Markdown dentro do editor.',
          en: 'Markdown support inside the editor.',
        },
      },
      {
        slug: 'keymap',
        category: 'development',
        sourcePath: 'docs/ui-ux/keymap.md',
        sourceBlob: 'f16663fac7fadb5278b214dcaa607d29ef93fa2f',
        title: { 'pt-BR': 'Mapa de teclas', en: 'Key map' },
        description: {
          'pt-BR': 'Atalhos padrão e como remapeá-los.',
          en: 'Default shortcuts and how to remap them.',
        },
      },
      {
        slug: 'layout',
        category: 'development',
        sourcePath: 'docs/ui-ux/layout.md',
        sourceBlob: '02b6110a00098b491a1620a9fbd5b78ad69e7b11',
        title: { 'pt-BR': 'Layout', en: 'Layout' },
        description: {
          'pt-BR': 'Como a superfície do editor se organiza em painéis.',
          en: 'How the editor surface is organised into panels.',
        },
      },
      {
        slug: 'changelog',
        category: 'roadmap',
        sourcePath: 'CHANGELOG.md',
        sourceBlob: '19d03cdd5e8ace8edefc1db20690dbfe0a5127c3',
        title: { 'pt-BR': 'Histórico de versões', en: 'Changelog' },
        description: {
          'pt-BR': 'O que mudou em cada versão publicada do editor.',
          en: 'What changed in each released version of the editor.',
        },
      },
      {
        slug: 'roadmap',
        category: 'roadmap',
        sourcePath: 'ROADMAP.md',
        sourceBlob: 'e00fbfc109aca046ac4cefef74afb68887e8db9a',
        title: { 'pt-BR': 'Planos', en: 'Roadmap' },
        description: {
          'pt-BR': 'O que está previsto para as próximas versões.',
          en: 'What is planned for upcoming versions.',
        },
      },
    ],
  },
  {
    project: 'prumo',
    repository: 'https://github.com/poppy-team/prumo',
    revision: PRUMO_REVISION,
    license: 'MIT',
    licenseFile: 'LICENSE',
    pages: [
      {
        slug: 'getting-started',
        category: 'guides',
        sourcePath: 'docs/getting-started/index.md',
        sourceBlob: '46eedc9bcb6bc5e3b429d288ab57bd711b2d1544',
        title: { 'pt-BR': 'Começando com o Prumo', en: 'Getting started with Prumo' },
        description: {
          'pt-BR': 'Instalação rápida e o que o protocolo resolve.',
          en: 'Quick installation and what the protocol solves.',
        },
      },
      {
        slug: 'concepts',
        category: 'guides',
        sourcePath: 'docs/getting-started/concepts.md',
        sourceBlob: 'c2bd213a172779d82160bdcca3996588a19585db',
        title: { 'pt-BR': 'Conceitos', en: 'Concepts' },
        description: {
          'pt-BR': 'Goals, planos, contexto e as garantias do protocolo.',
          en: 'Goals, plans, context, and the protocol’s guarantees.',
        },
      },
      {
        slug: 'first-project',
        category: 'guides',
        sourcePath: 'docs/getting-started/first-project.md',
        sourceBlob: 'b136dfffaa8a2f602a0c110d1a20611a98030afb',
        title: { 'pt-BR': 'Seu primeiro projeto', en: 'Your first project' },
        description: {
          'pt-BR': 'Adotar o Prumo em um repositório existente.',
          en: 'Adopting Prumo in an existing repository.',
        },
      },
      {
        slug: 'installation',
        category: 'guides',
        sourcePath: 'docs/manual/installation.md',
        sourceBlob: '1ba1749b36a918f2873f12da5e1e82e745a7c71c',
        title: { 'pt-BR': 'Instalação', en: 'Installation' },
        description: {
          'pt-BR': 'Instalar a CLI e configurar o ambiente.',
          en: 'Installing the CLI and configuring the environment.',
        },
      },
      {
        slug: 'usage',
        category: 'guides',
        sourcePath: 'docs/manual/usage.md',
        sourceBlob: 'eafa2f658fb115867068fd90d178cf5d6e628918',
        title: { 'pt-BR': 'Uso diário', en: 'Daily use' },
        description: {
          'pt-BR': 'Os comandos mais usados no trabalho com pessoas e agentes.',
          en: 'The most used commands when working with people and agents.',
        },
      },
      {
        slug: 'connectors',
        category: 'guides',
        sourcePath: 'docs/manual/connectors.md',
        sourceBlob: 'dcb24fbe2b89ac10ce32d5fec97d26a69bb6f7dc',
        title: { 'pt-BR': 'Conectores', en: 'Connectors' },
        description: {
          'pt-BR': 'Como o protocolo conversa com diferentes agentes de IA.',
          en: 'How the protocol talks to different AI agents.',
        },
      },
      {
        slug: 'goals',
        category: 'guides',
        sourcePath: 'docs/user-guide/goals.md',
        sourceBlob: 'a7c329caf1fd40df896163ce8d11be6e6406e0a5',
        title: { 'pt-BR': 'Goals', en: 'Goals' },
        description: {
          'pt-BR': 'Objetivos verificáveis e o ciclo de estados de um Goal.',
          en: 'Verifiable objectives and the state lifecycle of a Goal.',
        },
      },
      {
        slug: 'goals-101',
        category: 'guides',
        sourcePath: 'docs/user-guide/goals-101.md',
        sourceBlob: 'de2a80e10243df4b323088421b69463e07e881cc',
        title: { 'pt-BR': 'Goals na prática', en: 'Goals in practice' },
        description: {
          'pt-BR': 'Um acompanhamento mais detalhado do uso de Goals.',
          en: 'A more detailed walkthrough of using Goals.',
        },
      },
      {
        slug: 'troubleshooting',
        category: 'guides',
        sourcePath: 'docs/user-guide/troubleshooting.md',
        sourceBlob: '475c140de7e604ca26f2a988515ce9e80feb4a2a',
        title: { 'pt-BR': 'Resolução de problemas', en: 'Troubleshooting' },
        description: {
          'pt-BR': 'Diagnóstico quando uma validação falha ou um objetivo trava.',
          en: 'Diagnosis when a validation fails or a goal gets stuck.',
        },
      },
      {
        slug: 'cli-reference',
        category: 'guides',
        sourcePath: 'docs/tools/cli-reference.md',
        sourceBlob: 'd942879dda78a7de3aff9ca5621679d8b3ec1c43',
        title: { 'pt-BR': 'Referência da CLI', en: 'CLI reference' },
        description: {
          'pt-BR': 'Os comandos, sinalizadores e códigos de saída do prumo.',
          en: 'The commands, flags, and exit codes of prumo.',
        },
      },
      {
        slug: 'changelog',
        category: 'roadmap',
        sourcePath: 'CHANGELOG.md',
        sourceBlob: '30101bd314b663e1b46670a34079cab95d8abc57',
        title: { 'pt-BR': 'Histórico de versões', en: 'Changelog' },
        description: {
          'pt-BR': 'O que mudou em cada versão publicada do protocolo.',
          en: 'What changed in each released version of the protocol.',
        },
      },
    ],
  },
];

export function getDocsForProject(project: ProjectSlug): VendoredDocPage[] {
  return vendoredDocs.find((source) => source.project === project)?.pages ?? [];
}

export function getDocsByCategory(project: ProjectSlug, category: DocsCategory): VendoredDocPage[] {
  return getDocsForProject(project).filter((page) => page.category === category);
}
