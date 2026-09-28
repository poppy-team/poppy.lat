# Poppy Team

Site editorial bilíngue para projetos de linguagens e ferramentas da Poppy Team. A prova técnica usa VitePress + Vue 3 + TypeScript e gera HTML estático.

## O que há no site

- Ori e Aipo em destaque; Oride e Prumo como projetos complementares.
- Páginas de projeto com propósito, princípios, exemplos estáticos, links para as fontes e a lista das páginas de documentação daquele projeto.
- Documentação própria para os quatro projetos, em `/docs/<projeto>/` e `/en/docs/<projeto>/`, organizada em três categorias: guia de uso, novidades e planos, e desenvolvimento.
- Cada projeto tem identidade visual própria — cor de destaque, landing e navegação dedicadas — preservada nos temas claro e escuro.
- Caderno de notas escrito em Markdown.
- Português na raiz e inglês em `/en/`.
- Marca da Poppy Team no cabeçalho do site e da documentação, em variante clara (`site/public/assets/poppy-logo.svg`) e escura (`site/public/assets/poppy-logo-dark.svg`). O arquivo tem só o desenho, então o wordmark tipográfico continua ao lado dele.

Nenhum exemplo de Ori, Aipo, Oride ou Prumo é compilado ou executado no navegador. A URL canônica do site continua pendente; o build não emite sitemap até essa escolha ser confirmada.

## Estrutura

- `site/`: fonte do VitePress. A árvore de arquivos é o mapa de rotas.
- `site/.vitepress/`: configuração, tema, layouts e componentes.
- `site/docs/` e `site/en/docs/`: documentação importada dos repositórios canônicos.
- `packages/project-data/`: fonte única de dados de projeto, copy i18n e taxonomia documental.
- `scripts/`: geração de conteúdo derivado (importação, rotas, manifesto, 404).
- `docs/`: documentação interna do repositório; não é publicada.
- `tests/`: suíte Vitest sobre o HTML gerado.

## Começar localmente

Requisitos: Node.js `>=22.12.0`, pnpm `11.17.0` e Prumo `0.6.0` para gates do projeto.

```bash
pnpm install
pnpm dev
```

## Verificar e gerar o site

```bash
pnpm check
pnpm test
pnpm build
pnpm preview
```

A saída de produção estática fica em `site/.vitepress/dist/`. Não é necessário adapter SSR. `pnpm test` valida rotas, proveniência, integração entre projeto e documentação, paridade de idioma, identidade visual e resolução de todos os links internos do HTML gerado.

## Regenerar conteúdo

```bash
pnpm content   # importa a allow-list e escreve os stubs de rota
```

A importação lê cada arquivo na revisão fixada, confere o blob com `git rev-parse` e só então escreve a cópia local. Um repositório que tenha avançado não pode vazar conteúdo novo para o site.

## Fontes de documentação

`site/public/sources.json` lista cada documento público permitido, sua revisão, blob, licença, categoria e destino local, com `schemaVersion` 2. Os repositórios de Ori, Aipo, Oride e Prumo seguem canônicos e não são alterados por este site. Leia também [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md), servido em `/third-party-notices.txt`.

Páginas cuja origem ainda não tem versão em inglês recebem um stub que declara a pendência e aponta a versão em português e a fonte canônica.

## Governança Prumo

- [Roteiro da documentação](docs/PRUMO.md)
- [ADR 003 — VitePress como plataforma de documentação](docs/architecture/adr/003-vitepress-documentation-platform.md)
- [Goal P01-G01](.ai/goals/P01/P01-G01.goal.json)
- [Estado atual](PROJECT_STATE.md)
- Validar o scaffold: `prumo validate .` e `prumo doctor .`
