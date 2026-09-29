# Visão de Arquitetura

## Topologia

```text
Markdown local ───────────┐
packages/project-data ───┼─> VitePress + Vue 3 ─> HTML estático
Cópias allow-listed ─────┘        │
                                  └─ docs/<projeto>/ e en/docs/<projeto>/
```

- `site/`: fonte do VitePress; a árvore de arquivos é o mapa de rotas.
- `site/.vitepress/config.ts`: locales, sidebar por projeto, busca local e aliases.
- `site/.vitepress/theme/`: tokens, estilos, componentes e layouts do site.
- `site/docs/` e `site/en/docs/`: documentação importada e páginas de índice por projeto.
- `site/public/`: manifesto de fontes, avisos de licença e logos.
- `packages/project-data/`: fonte única de dados de projeto, copy i18n e taxonomia documental.
- `scripts/`: geração de conteúdo derivado — importação da allow-list, stubs de rota, manifesto e página 404.
- `docs/`: documentação interna do repositório; não é publicada.
- `site/public/sources.json`: allow-list com revisões, blobs e categoria de cada página; gerado a partir de `packages/project-data`.
- `THIRD_PARTY_NOTICES.md`: avisos de copyright e licenças das fontes redistribuídas, servidos em `/third-party-notices.txt`.
- `tests/static-site.test.ts`: suíte Vitest sobre o HTML gerado.

## Renderização e idioma

O VitePress gera HTML sem adapter de servidor. PT-BR é o idioma raiz; inglês usa prefixo `/en/`. O sitemap depende de uma URL canônica do site, ainda não definida; por isso, o build não o emite.

O idioma da página vem do locale do VitePress, não de uma convenção de pasta, e o comutador de idioma preserva o caminho equivalente. O caderno é a única exceção: as duas traduções têm slugs diferentes, ligados por `translationKey` no frontmatter.

## Identidade por projeto

Cada página declara `project` no frontmatter. O shell converte esse atributo em `data-project` no elemento raiz, e o CSS deriva a cor de destaque a partir dos tokens. Uma página nunca deduce seu projeto pela URL.

## Integração entre projeto e documentação

`packages/project-data` é a fonte única dos dois lados: a página do projeto lê a lista de páginas do projeto a partir do registro documental, e a página de documentação lê nome, cor e repositório a partir do registro de projeto. Nenhum texto editorial é duplicado entre as duas.

## Fontes canônicas

Os repositórios `poppy-team/ori-lang`, `poppy-team/aipo-lang`, `poppy-team/oride` e `poppy-team/prumo` são fontes canônicas. O site contém cópias estáticas curadas, identificadas por commit e blob, e a importação falha se o blob não bater com o declarado. Uma mudança no upstream só chega ao site por uma atualização explícita da allow-list.

## Limites de execução

Exemplos de Ori, Aipo, Oride e Prumo são blocos de texto. O browser não recebe compilador, runtime, WASM ou API de execução. O site não possui backend nem estado de usuário nesta fatia.
