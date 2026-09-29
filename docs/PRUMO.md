# Prumo — Poppy Team

Ponto de entrada para pessoas e agentes que trabalham no site Poppy Team. A documentação canônica de engenharia fica em português; conteúdo do produto também tem versão em inglês quando aplicável.

## Estado atual

- [Estado do projeto](../PROJECT_STATE.md)
- [Goal ativo P01-G01](../.ai/goals/P01/P01-G01.goal.json) — documentação por projeto em VitePress
- [Manifesto Prumo](../prumo.json)

## Produto e conteúdo

- [Visão de produto](product/vision.md)
- [Escopo e limites](product/scope.md)
- [Arquitetura VitePress](architecture/overview.md)
- [ADR-003 — plataforma de documentação](architecture/adr/003-vitepress-documentation-platform.md)
- [ADR-002 — site estático e allow-list](architecture/adr/002-static-bilingual-site.md)
- [Manifesto de fontes públicas](../site/public/sources.json)
- [Avisos de terceiros e licenças](../THIRD_PARTY_NOTICES.md)

## Interface

- [Tokens visuais](01-ui/DESIGN_TOKENS.md)
- [Arquitetura HTML](01-ui/HTML_ARCHITECTURE.md)
- [Arquitetura CSS](01-ui/CSS_ARCHITECTURE.md)
- [Convenções HTML/CSS](01-ui/HTML_CSS_NAMING_CONVENTIONS.md)
- [Catálogo de componentes](01-ui/COMPONENT_CATALOG.md)
- [Estilo de conteúdo](01-ui/CONTENT_STYLE.md)

## Desenvolver e validar

Com Node.js `>=22.12.0` e pnpm:

```bash
pnpm install --frozen-lockfile --ignore-scripts
pnpm check
pnpm test
pnpm build
prumo validate .
prumo doctor .
```

O build é estático. Não há adapter de servidor, CMS, execução de código no browser ou importação recursiva de docs. A busca de domínio/hostname canônico não foi definida; por isso, o build não emite sitemap até essa decisão.

## Para agentes

1. Ler este roteador, `PROJECT_STATE.md` e o Goal ativo.
2. Escolher contexto mínimo para a tarefa; não varrer os repositórios-fonte.
3. Ao mudar conteúdo documental, atualizar o manifesto/avisos se a origem ou seleção mudar.
4. Validar links internos, idioma, acessibilidade e build.
5. Não enfraquecer critérios do Goal nem incluir documentos não aprovados.
