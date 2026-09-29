export type Locale = 'pt-BR' | 'en';

export type ProjectSlug = 'ori' | 'aipo' | 'oride' | 'prumo';

/** Editorial audience a documentation page belongs to. */
export type DocsCategory = 'guides' | 'roadmap' | 'development';

/**
 * Short status line shown on the home cards and the project pages, in the
 * spirit of the maturity and positioning badge the Ori site carries.
 */
export interface ProjectBadge {
  /** Maturity or release stage, for example `S3`. */
  stage: string;
  /** Two or three words naming what defines the project. */
  positioning: string;
  /** Optional third marker; omitted when the project has nothing to claim. */
  note?: string;
}

export interface ProjectPrinciple {
  title: string;
  description: string;
}

export interface ProjectDemo {
  label: string;
  language: string;
  code: string;
  /**
   * What running the sample prints. Shown as a terminal line under the code so
   * the sample reads as input and outcome rather than input alone. It is
   * illustrative text: nothing is executed in the browser.
   */
  output: string;
  note: string;
}

export interface ProjectCopy {
  eyebrow: string;
  summary: string;
  purposeTitle: string;
  purpose: string;
  philosophyTitle: string;
  principles: ProjectPrinciple[];
  demoTitle: string;
  demo: ProjectDemo;
  documentationLabel: string;
}

export interface Project {
  slug: ProjectSlug;
  number: string;
  featured: boolean;
  name: string;
  category: Record<Locale, string>;
  homeSummary: Record<Locale, string>;
  repositoryHref: string;
  /** Token name that carries this project's visual identity. */
  colorToken: string;
  /** Status line, shared across locales. */
  badge: ProjectBadge;
  /**
   * A few lines of the language, taken from its documentation, shown on the
   * home card so a featured project is recognisable by its code.
   */
  excerpt?: string;
  copy: Record<Locale, ProjectCopy>;
}

export const projects = [
  {
    slug: 'ori',
    number: '01',
    featured: true,
    name: 'Ori',
    category: {
      'pt-BR': 'Linguagem compilada',
      en: 'Compiled language',
    },
    homeSummary: {
      'pt-BR': 'Uma linguagem de leitura cuidadosa, tipos explícitos e compilação nativa.',
      en: 'A reading-first language with explicit types and native compilation.',
    },
    repositoryHref: 'https://github.com/poppy-team/ori-lang',
    colorToken: 'var(--color-leaf-pale)',
    badge: { stage: 'S3', positioning: 'READING-FIRST', note: 'ND-FRIENDLY' },
    excerpt: 'module demo.main\n\nimport ori.test as test\n\n@test\nmath_is_stable()\n    test.assert(1 + 1 == 2, "math should work")\nend',
    copy: {
      'pt-BR': {
        eyebrow: 'Linguagem compilada para código nativo',
        summary: 'Ori é uma linguagem de programação de leitura cuidadosa e tipagem explícita, compilada para código nativo. O modo JIT também pode ser usado ao executar programas com a ferramenta da linguagem.',
        purposeTitle: 'Para que existe',
        purpose: 'Ori explora como sintaxe clara, tipos visíveis e ferramentas integradas podem tornar programas nativos mais fáceis de ler, verificar e manter.',
        philosophyTitle: 'Princípios de projeto',
        principles: [
          {
            title: 'Leitura antes do atalho',
            description: 'A forma do programa deve deixar sua estrutura visível para quem chega ao código depois.',
          },
          {
            title: 'Tipos como parte do texto',
            description: 'Assinaturas explícitas ajudam a explicar as fronteiras entre funções e módulos.',
          },
          {
            title: 'Compilação nativa',
            description: 'O compilador AOT produz executáveis nativos; o JIT está disponível no fluxo de execução da ferramenta.',
          },
        ],
        demoTitle: 'Um programa pequeno',
        demo: {
          label: 'Exemplo estático da documentação de Ori',
          language: 'ori',
          code: 'module app.hello\nimport ori.io as io\nmain()\nio.println("Hello, Ori!")\nend',
          output: 'Hello, Ori!',
          note: 'Este bloco é apenas uma amostra de código. Esta página não compila nem executa Ori no navegador.',
        },
        documentationLabel: 'Abrir documentação selecionada de Ori',
      },
      en: {
        eyebrow: 'Compiled language for native code',
        summary: 'Ori is a reading-first, explicitly typed programming language compiled to native code. Its toolchain also offers a JIT mode when running programs.',
        purposeTitle: 'Why it exists',
        purpose: 'Ori explores how clear syntax, visible types, and integrated tools can make native programs easier to read, check, and maintain.',
        philosophyTitle: 'Design principles',
        principles: [
          {
            title: 'Reading before shortcuts',
            description: 'A program’s shape should make its structure visible to the next person reading the code.',
          },
          {
            title: 'Types belong in the text',
            description: 'Explicit signatures help explain the boundaries between functions and modules.',
          },
          {
            title: 'Native compilation',
            description: 'The AOT compiler produces native executables; JIT is available in the toolchain’s run flow.',
          },
        ],
        demoTitle: 'A small program',
        demo: {
          label: 'Static example from Ori documentation',
          language: 'ori',
          code: 'module app.hello\nimport ori.io as io\nmain()\nio.println("Hello, Ori!")\nend',
          output: 'Hello, Ori!',
          note: 'This block is a code sample only. This page does not compile or run Ori in the browser.',
        },
        documentationLabel: 'Open the selected Ori documentation',
      },
    },
  },
  {
    slug: 'aipo',
    number: '02',
    featured: true,
    name: 'Aipo',
    category: {
      'pt-BR': 'Linguagem dinâmica',
      en: 'Dynamic language',
    },
    homeSummary: {
      'pt-BR': 'Uma linguagem dinâmica e fortemente tipada, com contratos opcionais.',
      en: 'A dynamic, strongly typed language with optional contracts.',
    },
    repositoryHref: 'https://github.com/poppy-team/aipo-lang',
    colorToken: 'var(--color-blue-pale)',
    badge: { stage: 'S2', positioning: 'CONTRACTS-FIRST' },
    excerpt: 'struct Temperature {\n    var celsius = 0.0\n}\n\nimpl Temperature {\n    invariant {\n        self.celsius >= -273.15\n    }\n}',
    copy: {
      'pt-BR': {
        eyebrow: 'Linguagem dinâmica com contratos opcionais',
        summary: 'Aipo é uma linguagem de propósito geral, dinâmica e fortemente tipada, com suporte a contratos e invariantes. Seu toolchain em Rust inclui uma VM de bytecode e um backend JavaScript.',
        purposeTitle: 'Para que existe',
        purpose: 'Aipo investiga como manter a flexibilidade de uma linguagem dinâmica sem esconder incompatibilidades de tipos, e como aproximar contratos do código que eles protegem.',
        philosophyTitle: 'Princípios de projeto',
        principles: [
          {
            title: 'Conversões intencionais',
            description: 'Valores incompatíveis não são convertidos silenciosamente; o programa precisa expressar a intenção.',
          },
          {
            title: 'Invariantes junto aos dados',
            description: 'Contratos estruturais podem ser declarados no próprio modelo que deve preservá-los.',
          },
          {
            title: 'Mais de um destino',
            description: 'O projeto mantém uma VM de bytecode em Rust e um backend que emite JavaScript.',
          },
        ],
        demoTitle: 'Primeira saída',
        demo: {
          label: 'Exemplo estático da documentação de Aipo',
          language: 'aipo',
          code: 'io.println("Olá do Aipo!")',
          output: 'Olá do Aipo!',
          note: 'Este bloco é apenas uma amostra de código. Esta página não compila nem executa Aipo no navegador.',
        },
        documentationLabel: 'Abrir documentação selecionada de Aipo',
      },
      en: {
        eyebrow: 'Dynamic language with optional contracts',
        summary: 'Aipo is a general-purpose, dynamically and strongly typed language with support for contracts and invariants. Its Rust toolchain includes a bytecode VM and a JavaScript backend.',
        purposeTitle: 'Why it exists',
        purpose: 'Aipo explores how to keep the flexibility of a dynamic language without hiding type mismatches, and how to bring contracts closer to the code they protect.',
        philosophyTitle: 'Design principles',
        principles: [
          {
            title: 'Intentional conversions',
            description: 'Incompatible values are not silently converted; programs must express that intent.',
          },
          {
            title: 'Invariants beside the data',
            description: 'Structural contracts can be declared alongside the model that must preserve them.',
          },
          {
            title: 'More than one target',
            description: 'The project maintains a Rust bytecode VM and a backend that emits JavaScript.',
          },
        ],
        demoTitle: 'First output',
        demo: {
          label: 'Static example from Aipo documentation',
          language: 'aipo',
          code: 'io.println("Hello from Aipo!")',
          output: 'Hello from Aipo!',
          note: 'This block is a code sample only. This page does not compile or run Aipo in the browser.',
        },
        documentationLabel: 'Open the selected Aipo documentation',
      },
    },
  },
  {
    slug: 'oride',
    number: '03',
    featured: false,
    name: 'Oride',
    category: {
      'pt-BR': 'Editor de terminal',
      en: 'Terminal editor',
    },
    homeSummary: {
      'pt-BR': 'Um editor de código e IDE leve para o terminal, escrito em Rust.',
      en: 'A lightweight terminal code editor and IDE written in Rust.',
    },
    repositoryHref: 'https://github.com/poppy-team/oride',
    colorToken: 'var(--color-oride-pale)',
    badge: { stage: 'S1', positioning: 'TERMINAL-FIRST', note: 'IN PROGRESS' },
    copy: {
      'pt-BR': {
        eyebrow: 'Editor de código e IDE para terminal',
        summary: 'Oride é um editor de código modular e leve para o terminal, feito em Rust. O repositório descreve recursos como árvore de projeto, terminal integrado recolhível, edição modal, executor de tarefas e diagnósticos.',
        purposeTitle: 'Para que existe',
        purpose: 'Oride reúne atividades comuns de edição em uma interface de terminal, mantendo o projeto modular e extensível.',
        philosophyTitle: 'Direção de projeto',
        principles: [
          {
            title: 'Interface no terminal',
            description: 'A edição e a navegação do projeto acontecem no ambiente de terminal.',
          },
          {
            title: 'Ferramentas próximas',
            description: 'A proposta inclui terminal integrado, executor de tarefas e sistema de diagnósticos.',
          },
          {
            title: 'Base modular',
            description: 'O editor é construído em Rust com foco declarado em modularidade e extensibilidade.',
          },
        ],
        demoTitle: 'Composição ilustrativa',
        demo: {
          label: 'Diagrama estático; não é uma captura da interface',
          language: 'text',
          code: '┌─ Oride · workspace\n│  ├─ project tree\n│  ├─ editor surface\n│  └─ integrated terminal\n└─ tasks · diagnostics',
          output: 'workspace ready',
          note: 'Composição editorial para explicar áreas citadas no repositório. Não representa uma captura de tela, e nada é executado no navegador.',
        },
        documentationLabel: 'Abrir documentação selecionada de Oride',
      },
      en: {
        eyebrow: 'Terminal code editor and IDE',
        summary: 'Oride is a modular, lightweight terminal code editor built in Rust. Its repository describes features including a project tree, collapsible embedded terminal, modal editing, task runner, and diagnostics.',
        purposeTitle: 'Why it exists',
        purpose: 'Oride brings common editing activities into a terminal interface while keeping the project modular and extensible.',
        philosophyTitle: 'Project direction',
        principles: [
          {
            title: 'A terminal interface',
            description: 'Project navigation and editing happen inside the terminal environment.',
          },
          {
            title: 'Tools close at hand',
            description: 'The stated direction includes an embedded terminal, task runner, and diagnostic system.',
          },
          {
            title: 'A modular foundation',
            description: 'The editor is built in Rust with an explicit focus on modularity and extensibility.',
          },
        ],
        demoTitle: 'Illustrative composition',
        demo: {
          label: 'Static diagram; not a screenshot of the interface',
          language: 'text',
          code: '┌─ Oride · workspace\n│  ├─ project tree\n│  ├─ editor surface\n│  └─ integrated terminal\n└─ tasks · diagnostics',
          output: 'workspace ready',
          note: 'Editorial composition describing areas named by the repository. It is not a screenshot, and nothing runs in the browser.',
        },
        documentationLabel: 'Open the selected Oride documentation',
      },
    },
  },
  {
    slug: 'prumo',
    number: '04',
    featured: false,
    name: 'Prumo',
    category: {
      'pt-BR': 'Protocolo e CLI',
      en: 'Protocol and CLI',
    },
    homeSummary: {
      'pt-BR': 'Um protocolo Git-native para colaboração entre pessoas e agentes de IA.',
      en: 'A Git-native protocol for collaboration between people and AI agents.',
    },
    repositoryHref: 'https://github.com/poppy-team/prumo',
    colorToken: 'var(--color-prumo-pale)',
    badge: { stage: 'S2', positioning: 'GIT-NATIVE' },
    copy: {
      'pt-BR': {
        eyebrow: 'Protocolo e CLI Git-native',
        summary: 'Prumo organiza o trabalho de software feito por pessoas e agentes de IA usando o repositório como fonte durável de verdade, com Goals verificáveis e documentação rastreável.',
        purposeTitle: 'Para que existe',
        purpose: 'Prumo torna objetivos, decisões e evidências de um projeto legíveis no próprio Git, reduzindo dependência de estado escondido em uma ferramenta externa.',
        philosophyTitle: 'Princípios de projeto',
        principles: [
          {
            title: 'Git como fonte durável',
            description: 'O estado importante do projeto permanece em arquivos versionados e revisáveis.',
          },
          {
            title: 'Objetivos verificáveis',
            description: 'Goals descrevem resultados observáveis e seguem um ciclo explícito de estados.',
          },
          {
            title: 'Contexto progressivo',
            description: 'Pessoas e agentes começam pelo contexto mínimo suficiente e o ampliam quando necessário.',
          },
        ],
        demoTitle: 'Um ciclo de trabalho',
        demo: {
          label: 'Exemplo de comandos; a saída não é executada nesta página',
          language: 'sh',
          code: 'prumo goal list\nprumo validate .\nprumo doctor .',
          output: 'P00-G01  EXECUTING\nvalidation passed\ndoctor: clean',
          note: 'Os comandos são mostrados como texto para explicar o fluxo. Não há execução de comandos nem do Prumo no navegador.',
        },
        documentationLabel: 'Abrir documentação selecionada de Prumo',
      },
      en: {
        eyebrow: 'Git-native protocol and CLI',
        summary: 'Prumo organizes software work by people and AI agents around the repository as a durable source of truth, with verifiable Goals and traceable documentation.',
        purposeTitle: 'Why it exists',
        purpose: 'Prumo keeps project objectives, decisions, and evidence readable in Git itself, reducing dependence on hidden state in an external tool.',
        philosophyTitle: 'Design principles',
        principles: [
          {
            title: 'Git as durable truth',
            description: 'Important project state stays in versioned, reviewable files.',
          },
          {
            title: 'Verifiable goals',
            description: 'Goals describe observable outcomes and follow an explicit state lifecycle.',
          },
          {
            title: 'Progressive context',
            description: 'People and agents start with the smallest sufficient context and expand it when needed.',
          },
        ],
        demoTitle: 'A work cycle',
        demo: {
          label: 'Command example; output is not executed here',
          language: 'sh',
          code: 'prumo goal list\nprumo validate .\nprumo doctor .',
          output: 'P00-G01  EXECUTING\nvalidation passed\ndoctor: clean',
          note: 'Commands are shown as text to explain a workflow. No commands, and no Prumo itself, run in the browser.',
        },
        documentationLabel: 'Open the selected Prumo documentation',
      },
    },
  },
] satisfies Project[];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

/**
 * Root prefix for a locale. Portuguese lives at the site root, English under /en.
 * Mirrors the VitePress `root`/`en` locale split, so hrefs stay predictable.
 */
export function localeRoot(locale: Locale): string {
  return locale === 'en' ? '/en' : '';
}

/** Documentation section for a project in a given locale. */
export function documentationHref(project: Project, locale: Locale): string {
  return `${localeRoot(locale)}/${project.slug}/docs/`;
}

/** Editorial project page for a project in a given locale. */
export function projectPageHref(project: Project, locale: Locale): string {
  return `${localeRoot(locale)}/projects/${project.slug}/`;
}

/** Counterpart route in the other locale, preserving the path after the locale root. */
export function switchLocaleHref(locale: Locale, routePath: string): string {
  const normalized = routePath.replace(/^\/(en)?/, '').replace(/\/index\.html$/, '/');
  const targetLocale: Locale = locale === 'en' ? 'pt-BR' : 'en';

  return targetLocale === 'en' ? `/en${normalized}` : normalized;
}
