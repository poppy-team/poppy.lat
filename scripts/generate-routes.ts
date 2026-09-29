/**
 * Writes the route stubs whose body is rendered by a custom layout:
 * project pages, the documentation index, and the journal.
 *
 * Bodies are intentionally empty — the layouts read their content from
 * packages/project-data so the text lives in exactly one place.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { projects, type Locale } from '../packages/project-data/src/projects.ts';

function localeDirectory(locale: Locale): string {
  return locale === 'en' ? 'en' : '';
}

async function write(relative: string, lines: string[]): Promise<void> {
  const destination = path.join('site', relative);

  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, `${lines.join('\n')}\n`, 'utf8');
}

/**
 * Journal entries. These are original editorial content rather than vendored
 * documentation, so they live here instead of in the import manifest.
 */
const posts = [
  {
    slug: 'um-arquivo-com-origem',
    locale: 'pt-BR' as const,
    title: 'Um arquivo com origem',
    description: 'Por que cada página importada deve continuar ligada à sua fonte canônica.',
    pubDate: '2026-09-28',
    translationKey: 'source-aware-archive',
    body: [
      'Um documento pode morar em mais de um lugar sem perder sua origem.',
      '',
      'Para esta prova técnica, cada página pública importada tem um repositório, uma revisão e uma licença identificáveis. O site guarda uma cópia de leitura; o projeto de origem continua sendo a fonte canônica.',
      '',
      'A consequência é deliberada: a cópia não se atualiza sozinha. Quando a origem muda, alguém decide se a mudança entra, e essa decisão fica registrada na allow-list.',
    ],
  },
  {
    slug: 'a-source-aware-archive',
    locale: 'en' as const,
    title: 'An archive with provenance',
    description: 'Why every imported page should remain connected to its canonical source.',
    pubDate: '2026-09-28',
    translationKey: 'source-aware-archive',
    body: [
      'A document can live in more than one place without losing its origin.',
      '',
      'For this proof of concept, every imported public page has an identifiable repository, revision, and license. The site keeps a reading copy; the source project remains canonical.',
      '',
      'The consequence is deliberate: the copy does not update itself. When the source changes, someone decides whether that change belongs here, and the decision is recorded in the allow-list.',
    ],
  },
];

for (const post of posts) {
  const root = localeDirectory(post.locale);

  await write(
    path.join(root, 'blog', `${post.slug}.md`),
    [
      '---',
      'layout: article',
      `title: ${JSON.stringify(post.title)}`,
      `description: ${JSON.stringify(post.description)}`,
      `pubDate: ${post.pubDate}`,
      `translationKey: ${JSON.stringify(post.translationKey)}`,
      `locale: ${post.locale}`,
      '---',
      '',
      ...post.body,
    ],
  );
}

for (const locale of ['pt-BR', 'en'] as const) {
  const root = localeDirectory(locale);
  const languageTag = locale === 'en' ? 'en' : 'pt-BR';

  await write(
    path.join(root, 'index.md'),
    [
      '---',
      'layout: site-home',
      'title: "Poppy Team"',
      `description: ${JSON.stringify(
        locale === 'en'
          ? 'Languages and tools with care for the reader.'
          : 'Linguagens e ferramentas com atenção à leitura.',
      )}`,
      `locale: ${languageTag}`,
      '---',
    ],
  );

  // VitePress reserves 404.md for its own shell and skips prerendering that
  // page's body, so the not-found page lives at its own route and the build
  // copies the Portuguese result over dist/404.html. Both locales exist so
  // the language switcher never offers a route that was never generated.
  await write(path.join(root, 'not-found', 'index.md'), [
    '---',
    'layout: not-found',
    `title: ${JSON.stringify(locale === 'en' ? 'Page not found' : 'Página não encontrada')}`,
    `locale: ${languageTag}`,
    '---',
  ]);

  for (const project of projects) {
    await write(
      path.join(root, 'projects', project.slug, 'index.md'),
      [
        '---',
        'layout: project-page',
        `title: ${JSON.stringify(project.name)}`,
        `description: ${JSON.stringify(project.homeSummary[locale])}`,
        `project: ${project.slug}`,
        `locale: ${languageTag}`,
        '---',
      ],
    );
  }

  await write(
    path.join(root, 'docs', 'index.md'),
    [
      '---',
      'title: "Documentação"',
      'description: "Guias, novidades e material de desenvolvimento de cada projeto."',
      `locale: ${languageTag}`,
      '---',
      '',
      '::: info Cópias estáticas',
      'As páginas abaixo são cópias estáticas selecionadas dos repositórios canônicos,',
      'fixadas em revisões identificadas. As fontes originais permanecem canônicas e as',
      'cópias locais não são atualizadas automaticamente.',
      ':::',
      '',
      ...projects.map(
        (project) =>
          `- [${project.name}](/${root ? `${root}/` : ''}docs/${project.slug}/) — ${project.homeSummary[locale]}`,
      ),
      '',
    ],
  );

  await write(
    path.join(root, 'blog', 'index.md'),
    [
      '---',
      'layout: blog-index',
      'title: "Caderno"',
      `locale: ${languageTag}`,
      '---',
      '',
      ...(locale === 'en'
        ? ['## Notes', '', '- [An archive with provenance](/en/blog/a-source-aware-archive)']
        : ['## Notas', '', '- [Um arquivo com origem](/blog/um-arquivo-com-origem)']),
      '',
    ],
  );
}

console.log('route stubs written');
