/**
 * The course catalogue: every course, module and lesson, including the ones
 * not written yet, so the landing can show the whole map and the sidebar and
 * lesson bar agree on order and counts.
 *
 * Shared by the site config (sidebar, at build time) and the theme (landing
 * and lesson bar, in the browser), so it must not import anything from Node.
 * Courses are Portuguese-only for now; see the plan in the project files.
 */

export type LessonStatus = 'available' | 'planned';

export interface CourseLesson {
  slug: string;
  title: string;
  /** Estimated reading and doing time, in minutes. */
  minutes: number;
  status: LessonStatus;
}

export interface CourseModule {
  slug: string;
  title: string;
  /** The small project the module builds, one lesson at a time. */
  project: string;
  lessons: CourseLesson[];
}

export interface Course {
  slug: string;
  title: string;
  summary: string;
  /** Which languages the course serves. */
  languages: ('ori' | 'aipo')[];
  audience: string;
  modules: CourseModule[];
}

export interface CourseTrack {
  slug: string;
  title: string;
  summary: string;
  courses: Course[];
}

export const coursesRoot = '/aprender';

export const courseTracks: CourseTrack[] = [
  {
    slug: 'comum',
    title: 'Curso comum',
    summary: 'Serve para Ori e Aipo ao mesmo tempo. Cada exemplo aparece nas duas linguagens.',
    courses: [
      {
        slug: 'comece-aqui',
        title: 'Começo aqui',
        summary: 'Para quem nunca programou: terminal, editor e como ler um erro.',
        languages: ['ori', 'aipo'],
        audience: 'Nunca programei',
        modules: [
          {
            slug: 'mesa-de-trabalho',
            title: 'A sua mesa de trabalho',
            project: 'Deixar o computador pronto para programar',
            lessons: [
              { slug: 'o-que-e-um-programa', title: 'O que é um programa', minutes: 6, status: 'planned' },
              { slug: 'terminal-sem-medo', title: 'O terminal sem medo', minutes: 10, status: 'planned' },
              { slug: 'editor-de-codigo', title: 'Um editor de código', minutes: 8, status: 'planned' },
              { slug: 'ler-um-erro', title: 'Como ler uma mensagem de erro', minutes: 8, status: 'planned' },
            ],
          },
        ],
      },
      {
        slug: 'pensar-em-codigo',
        title: 'Pensar em código',
        summary: 'Os conceitos de programação, construindo um projeto pequeno por módulo.',
        languages: ['ori', 'aipo'],
        audience: 'Quero aprender a programar',
        modules: [
          {
            slug: 'primeiro-programa',
            title: 'Primeiro programa',
            project: 'Cartão de apresentação no terminal',
            lessons: [
              { slug: 'ola', title: 'Seu primeiro programa', minutes: 8, status: 'available' },
              { slug: 'varias-linhas', title: 'Várias linhas de texto', minutes: 6, status: 'planned' },
              { slug: 'comentarios', title: 'Comentários: notas para quem lê', minutes: 5, status: 'planned' },
              { slug: 'montar-o-cartao', title: 'Montar o cartão', minutes: 10, status: 'planned' },
            ],
          },
          {
            slug: 'valores-e-nomes',
            title: 'Valores e nomes',
            project: 'Calculadora de gorjeta',
            lessons: [],
          },
          { slug: 'decisoes', title: 'Decisões', project: 'Classificador de senhas', lessons: [] },
          { slug: 'repeticao', title: 'Repetição', project: 'Tabuada e contador de palavras', lessons: [] },
          { slug: 'funcoes', title: 'Funções', project: 'Conversor de unidades', lessons: [] },
          { slug: 'dados-com-forma', title: 'Dados com forma', project: 'Agenda de contatos', lessons: [] },
          { slug: 'erros', title: 'Quando algo dá errado', project: 'Leitor de arquivo de notas', lessons: [] },
          { slug: 'organizar-e-testar', title: 'Organizar e testar', project: 'Lista de tarefas', lessons: [] },
        ],
      },
      {
        slug: 'como-uma-linguagem-funciona',
        title: 'Como uma linguagem funciona',
        summary: 'Construa Conta, uma linguagem de calculadora, do texto até a máquina virtual.',
        languages: ['ori', 'aipo'],
        audience: 'Quero entender como se cria uma linguagem',
        modules: [
          { slug: 'lexer', title: 'Do texto aos pedaços: o lexer', project: 'Conta', lessons: [] },
          { slug: 'parser', title: 'Dos pedaços à árvore: o parser', project: 'Conta', lessons: [] },
          { slug: 'interpretador', title: 'Dar sentido à árvore: o interpretador', project: 'Conta', lessons: [] },
          { slug: 'verificacao', title: 'Pegar erros antes de rodar', project: 'Conta', lessons: [] },
          { slug: 'maquina-virtual', title: 'Bytecode e máquina virtual', project: 'Conta', lessons: [] },
          { slug: 'diagnosticos', title: 'Mensagens de erro que ajudam', project: 'Conta', lessons: [] },
        ],
      },
    ],
  },
  {
    slug: 'ori',
    title: 'Trilha Ori',
    summary: 'Do uso da linguagem até o compilador por dentro.',
    courses: [
      {
        slug: 'usar-ori',
        title: 'Usar Ori',
        summary: 'Ferramenta de linha de comando, analisador de logs, jogo de terminal e interop com C.',
        languages: ['ori'],
        audience: 'Já programo',
        modules: [],
      },
      {
        slug: 'por-dentro-da-ori',
        title: 'Por dentro da Ori',
        summary: 'Lexer, parser, tipos, IR, AOT e JIT, lendo o código real do compilador.',
        languages: ['ori'],
        audience: 'Quero contribuir',
        modules: [],
      },
    ],
  },
  {
    slug: 'aipo',
    title: 'Trilha Aipo',
    summary: 'Do uso da linguagem até a máquina virtual por dentro.',
    courses: [
      {
        slug: 'usar-aipo',
        title: 'Usar Aipo',
        summary: 'Modelos com invariantes, apps web, jogos e programas que rodam no navegador.',
        languages: ['aipo'],
        audience: 'Já programo',
        modules: [],
      },
      {
        slug: 'por-dentro-da-aipo',
        title: 'Por dentro da Aipo',
        summary: 'HIR, VM de bytecode, backend JavaScript e contratos em tempo de execução.',
        languages: ['aipo'],
        audience: 'Quero contribuir',
        modules: [],
      },
    ],
  },
];

export function lessonRoute(course: Course, module: CourseModule, lesson: CourseLesson): string {
  return `${coursesRoot}/${course.slug}/${module.slug}/${lesson.slug}`;
}

/** Where the apostila of a course is served; made at build time from its written lessons. */
export const handoutsRoot = '/apostilas';

export function handoutHref(course: Pick<Course, 'slug'>): string {
  return `${handoutsRoot}/${course.slug}.md`;
}

/** A course has an apostila as soon as one of its lessons is written. */
export function hasHandout(course: Course): boolean {
  return course.modules.some((module) => module.lessons.some((lesson) => lesson.status === 'available'));
}

export interface LessonPlace {
  track: CourseTrack;
  course: Course;
  module: CourseModule;
  lesson: CourseLesson;
  /** 1-based position of the lesson in its module. */
  position: number;
}

/** Finds a lesson by its route, with or without a trailing slash or `.html`. */
export function lessonAt(route: string): LessonPlace | undefined {
  const clean = route.replace(/(\.html|\/)$/u, '');

  for (const track of courseTracks) {
    for (const course of track.courses) {
      for (const module of course.modules) {
        const index = module.lessons.findIndex((lesson) => lessonRoute(course, module, lesson) === clean);

        if (index >= 0) {
          return { track, course, module, lesson: module.lessons[index]!, position: index + 1 };
        }
      }
    }
  }

  return undefined;
}

/** Every lesson that has a page, in reading order. */
export function availableLessons(): { route: string; place: LessonPlace }[] {
  return courseTracks.flatMap((track) =>
    track.courses.flatMap((course) =>
      course.modules.flatMap((module) =>
        module.lessons
          .map((lesson, index) => ({ lesson, index }))
          .filter(({ lesson }) => lesson.status === 'available')
          .map(({ lesson, index }) => ({
            route: lessonRoute(course, module, lesson),
            place: { track, course, module, lesson, position: index + 1 },
          })),
      ),
    ),
  );
}
