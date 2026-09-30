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
export const AIPO_REVISION = '21ad042c30a8e684be68da712ceb9e56eb9c7774';
export const ORIDE_REVISION = '1cd515630b8ceb57777d466bee4970fe7c2e30e0';
export const PRUMO_REVISION = 'e91694d3959be1ed92757b34063efe0b2191821f';

export const vendoredDocs: VendoredDocSource[] = [
  {
    project: 'ori',
    repository: 'https://github.com/poppy-team/ori-lang',
    revision: ORI_REVISION,
    license: 'MIT',
    licenseFile: 'LICENSE',
    pages: [
      {
        slug: 'getting-started/install',
        category: 'guides',
        sourcePath: 'docs/install.pt-BR.md',
        sourceBlob: '1589150d9727ea0f8184cf3ee513054ba188de17',
        englishSourcePath: 'docs/install.md',
        englishSourceBlob: '642c5537a76a2c7e2e3d11d3af2d13ed49092126',
        title: { 'pt-BR': 'Instalação', en: 'Installing Ori' },
        description: {
          'pt-BR': 'Como instalar o Ori, conferir a instalação com ori doctor e atualizar para uma nova versão.',
          en: 'How to install Ori, check the install with ori doctor, and upgrade to a new release.',
        },
      },
      {
        slug: 'getting-started/first-project',
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
      {
        slug: 'getting-started/tour',
        category: 'guides',
        sourcePath: 'docs/language/tour.pt-BR.md',
        sourceBlob: '25f82a033a7b8e9e56e069791624f1f58a82ddfb',
        englishSourcePath: 'docs/language/tour.md',
        englishSourceBlob: '2a6b04b97c4cd087bf433e45116feea420c92ac4',
        title: { 'pt-BR': 'Tour da linguagem', en: 'Language tour' },
        description: {
          'pt-BR': 'Um passeio pela superfície S3: módulos, funções, tipos, result, match, pipe e traits.',
          en: 'A walk through the S3 surface: modules, functions, types, result, match, pipe, and traits.',
        },
      },
      {
        slug: 'language/advanced',
        category: 'guides',
        sourcePath: 'docs/language/advanced.pt-BR.md',
        sourceBlob: 'a1b0cc2f291db9883114b3e0e81ccd878b7f1471',
        englishSourcePath: 'docs/language/advanced.md',
        englishSourceBlob: '233f8aa829fa408e30a0cf5e4b56baca1b05708d',
        title: { 'pt-BR': 'Recursos avançados', en: 'Advanced features' },
        description: {
          'pt-BR': 'Slices, contratos, genéricos const, atributos de declaração, SIMD, arenas de memória e destrutores.',
          en: 'Slices, contracts, const generics, declaration attributes, SIMD, memory arenas, and destructors.',
        },
      },
      {
        slug: 'language/concurrency',
        category: 'guides',
        sourcePath: 'docs/language/concurrency.pt-BR.md',
        sourceBlob: '1b76a0ac25c67cfeed2b46d5e62cf6c927ae6a2d',
        englishSourcePath: 'docs/language/concurrency.md',
        englishSourceBlob: '51978bdb2cda3d032b69118e9e791ffaf577ec10',
        title: { 'pt-BR': 'Async e concorrência', en: 'Async and concurrency' },
        description: {
          'pt-BR': 'async e await, tasks, canais, atômicos e tokens de cancelamento.',
          en: 'async and await, tasks, channels, atomics, and cancellation tokens.',
        },
      },
      {
        slug: 'language/interop',
        category: 'guides',
        sourcePath: 'docs/language/interop.pt-BR.md',
        sourceBlob: 'efcb44a731016fc7e600f9321bf66a1f991852fe',
        englishSourcePath: 'docs/language/interop.md',
        englishSourceBlob: '915d88cb3788d013c7ce36ac1638e8ca973ee5fa',
        title: { 'pt-BR': 'Interop e ABI C', en: 'Interop and the C ABI' },
        description: {
          'pt-BR': 'Como chamar C com extern e publicar funções Ori para C com @c_export.',
          en: 'How to call C with extern and publish Ori functions to C with @c_export.',
        },
      },
      {
        slug: 'manual/cookbook',
        category: 'guides',
        sourcePath: 'docs/guides/cookbook.pt-BR.md',
        sourceBlob: '0b0f473949bfe6249969d1b3eee4368705b3667a',
        englishSourcePath: 'docs/guides/cookbook.md',
        englishSourceBlob: '4059814082934e4c1bc3d837497b1f58cc1a9c9a',
        title: { 'pt-BR': 'Cookbook', en: 'Cookbook' },
        description: {
          'pt-BR': 'Receitas para projetos pequenos e médios, com código S3 válido.',
          en: 'Recipes for small and medium projects, in valid S3 code.',
        },
      },
      {
        slug: 'manual/errors-null-void',
        category: 'guides',
        sourcePath: 'docs/guides/errors-null-void.pt-BR.md',
        sourceBlob: '6eb0e01507a8b7faa312428716b07218cb25abb4',
        englishSourcePath: 'docs/guides/errors-null-void.md',
        englishSourceBlob: 'f729d2e9d568f384f5e0c5d5e20ff1bb4ef8b532',
        title: { 'pt-BR': 'Erros, optional e void', en: 'Errors, optional, and void' },
        description: {
          'pt-BR': 'O modelo mental de ausência e falha: optional, result, try e void.',
          en: 'The mental model of absence and failure: optional, result, try, and void.',
        },
      },
      {
        slug: 'manual/testing',
        category: 'guides',
        sourcePath: 'docs/guides/testing.pt-BR.md',
        sourceBlob: 'c96448f2e2e6fe0c5a93f20408eda21a00fdd7e5',
        englishSourcePath: 'docs/guides/testing.md',
        englishSourceBlob: '2c9ba86c2efae69496088e9b4443383b13808e38',
        title: { 'pt-BR': 'Testes', en: 'Testing' },
        description: {
          'pt-BR': 'Como testar programas Ori com @test e ori test, e como testar o compilador.',
          en: 'How to test Ori programs with @test and ori test, and how to test the compiler.',
        },
      },
      {
        slug: 'manual/debugging',
        category: 'guides',
        sourcePath: 'docs/guides/debugging.pt-BR.md',
        sourceBlob: '3ae26de8d8b8d3d28b2fe5af0603586b2c54b044',
        englishSourcePath: 'docs/guides/debugging.md',
        englishSourceBlob: '5f86c74a893e230f8f10a39eee25c96bb7f2b845',
        title: { 'pt-BR': 'Depuração', en: 'Debugging' },
        description: {
          'pt-BR': 'O depurador de terminal, o servidor DAP e a integração com editores.',
          en: 'The terminal debugger, the DAP server, and editor integration.',
        },
      },
      {
        slug: 'manual/performance',
        category: 'guides',
        sourcePath: 'docs/guides/performance.pt-BR.md',
        sourceBlob: '3c04954ce944e49ad3b4031c22b541b325b1f4e4',
        englishSourcePath: 'docs/guides/performance.md',
        englishSourceBlob: 'b8b4d793fb1f09d84679481d7429477e339fe180',
        title: { 'pt-BR': 'Desempenho', en: 'Performance' },
        description: {
          'pt-BR': 'Microbench comparando Ori, Python e Rust, com o método usado.',
          en: 'A microbenchmark comparing Ori, Python, and Rust, with the method used.',
        },
      },
      {
        slug: 'reference/cli-reference',
        category: 'guides',
        sourcePath: 'docs/guides/cli-reference.pt-BR.md',
        sourceBlob: '74251452b8b97874816e8bcc7cbae9f251f78ae0',
        englishSourcePath: 'docs/guides/cli-reference.md',
        englishSourceBlob: '54b8d066327607dde1c4b6536a00a5bba2dcf649',
        title: { 'pt-BR': 'Referência da CLI', en: 'CLI reference' },
        description: {
          'pt-BR': 'Todos os comandos da CLI ori, suas opções e variáveis de ambiente.',
          en: 'Every ori CLI command, its options, and environment variables.',
        },
      },
      {
        slug: 'reference/stdlib-reference',
        category: 'guides',
        sourcePath: 'docs/guides/stdlib-reference.pt-BR.md',
        sourceBlob: '71529b3cf8eab2a85fab0b74147b19eff06672bd',
        englishSourcePath: 'docs/guides/stdlib-reference.md',
        englishSourceBlob: '66961a01ae4be925c6138e5374195477db6390fa',
        title: { 'pt-BR': 'Mapa da biblioteca padrão', en: 'Standard library map' },
        description: {
          'pt-BR': 'Os módulos ori.X da biblioteca padrão, posições de texto e convenções de erro.',
          en: 'The ori.X standard library modules, text positions, and error conventions.',
        },
      },
      {
        slug: 'bootstrapping',
        category: 'development',
        sourcePath: 'docs/guides/bootstrapping.pt-BR.md',
        sourceBlob: 'c3e1d5a5a1aa4e9525ad9890b2d04c81a5776716',
        englishSourcePath: 'docs/guides/bootstrapping.md',
        englishSourceBlob: '61fbc09badecf171536acbf74f6114c796b700b5',
        title: { 'pt-BR': 'Bootstrapping', en: 'Bootstrapping' },
        description: {
          'pt-BR': 'Como compilar o Ori a partir do código-fonte.',
          en: 'How to build Ori from source.',
        },
      },
      {
        slug: 'report-bugs',
        category: 'development',
        sourcePath: 'docs/guides/report-bugs.pt-BR.md',
        sourceBlob: '5dab081bda91830eb7eb10f363466f3508762519',
        englishSourcePath: 'docs/guides/report-bugs.md',
        englishSourceBlob: 'deda484d1a6ab4c06e3f342256bb4d3373b9d2ce',
        title: { 'pt-BR': 'Como reportar bugs', en: 'How to report bugs' },
        description: {
          'pt-BR': 'O que incluir num relato de bug para que ele possa ser reproduzido.',
          en: 'What to include in a bug report so it can be reproduced.',
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
        englishSourcePath: 'docs/en/ui-ux/keymap.md',
        englishSourceBlob: 'f914eaff26d1c4b3967ccf42214a513230975465',
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
        englishSourcePath: 'docs/en/ui-ux/layout.md',
        englishSourceBlob: '85a26df4efa5355e749c1d3bd71645730d12fde9',
        title: { 'pt-BR': 'Layout', en: 'Layout' },
        description: {
          'pt-BR': 'Como a superfície do editor se organiza em painéis.',
          en: 'How the editor surface is organised into panels.',
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
    ],
  },
];

export function getDocsForProject(project: ProjectSlug): VendoredDocPage[] {
  return vendoredDocs.find((source) => source.project === project)?.pages ?? [];
}

export function getDocsByCategory(project: ProjectSlug, category: DocsCategory): VendoredDocPage[] {
  return getDocsForProject(project).filter((page) => page.category === category);
}
