import { describe, expect, test } from 'vitest';
import { buildAllHandouts, buildHandout, convertLesson } from '../site/.vitepress/handout.ts';
import { courseTracks, handoutHref, hasHandout } from '../site/.vitepress/theme/data/courses.ts';

const lesson = `---
title: "Uma lição"
course: x
---

# Uma lição

Texto com [link do site](/ori/docs/guides/x) e [âncora](#depois).

## Passo

::: info Escolha
Veja **duas** abas.
:::

::: code-group

\`\`\`ori [Ori]
# isto não é título
main() -- [!code ++]
\`\`\`

\`\`\`bash{1,2} [Aipo]
aipo run a.aipo
\`\`\`

:::

::: tip
Sem título próprio.
:::

### Fim
`;

describe('convertLesson', () => {
  const { title, body } = convertLesson(lesson);

  test('tira o frontmatter e devolve o título', () => {
    expect(title).toBe('Uma lição');
    expect(body).not.toContain('course: x');
    expect(body).not.toMatch(/^# Uma lição/mu);
  });

  test('desce os títulos dois níveis, sem mexer no que está dentro do código', () => {
    expect(body).toContain('#### Passo');
    expect(body).toContain('##### Fim');
    expect(body).toContain('# isto não é título');
  });

  test('transforma contêineres em citações com título', () => {
    expect(body).toContain('> **Escolha**');
    expect(body).toContain('> Veja **duas** abas.');
    expect(body).toContain('> **Dica**');
    expect(body).not.toContain(':::');
  });

  test('o grupo de código vira blocos com rótulo e sem opções do VitePress', () => {
    expect(body).toContain('**Ori**\n\n```ori');
    expect(body).toContain('**Aipo**\n\n```bash\n');
    expect(body).not.toContain('[!code');
    expect(body).not.toContain('{1,2}');
  });

  test('links do site ficam absolutos e âncoras continuam locais', () => {
    expect(body).toContain('](https://poppy.lat/ori/docs/guides/x)');
    expect(body).toContain('](#depois)');
  });
});

describe('apostilas', () => {
  test('um curso sem lições escritas não tem apostila', () => {
    const empty = courseTracks.flatMap((track) => track.courses).find((course) => !hasHandout(course))!;

    expect(buildHandout(empty, { date: '2026-01-01', read: () => lesson })).toBeUndefined();
  });

  test('cada curso com lição escrita gera um arquivo com sumário e a lição', () => {
    const built = buildAllHandouts('site', '2026-09-30');

    expect(built.length).toBeGreaterThan(0);

    for (const { course, href, markdown } of built) {
      expect(href).toBe(handoutHref(course));
      expect(markdown.startsWith(`# ${course.title}\n`)).toBe(true);
      expect(markdown).toContain('## Sumário');
      expect(markdown).toContain('### Lição 1:');
      expect(markdown).not.toContain(':::');
      expect(markdown).not.toMatch(/^---\ncourse:/mu);
    }
  });
});
