# Poppy Team

Site editorial bilíngue para projetos de linguagens e ferramentas da Poppy Team. A prova técnica usa Astro + TypeScript + Starlight e gera HTML estático.

## O que há no site

- Ori e Aipo em destaque; Oride e Prumo como projetos complementares.
- Páginas de projeto com propósito, princípios, exemplos estáticos e links para as fontes.
- Caderno de notas escrito em Markdown.
- Documentação selecionada em `/docs/` e `/en/docs/`.
- Português na raiz e inglês em `/en/`.
- Marca da Poppy Team no cabeçalho do site e da documentação, em variante clara (`src/assets/poppy-logo.svg`) e escura (`src/assets/poppy-logo-dark.svg`). O arquivo tem só o desenho, então o wordmark tipográfico continua ao lado dele.

Nenhum exemplo de Ori ou Aipo é compilado ou executado no navegador. A URL canônica do site continua pendente; o build não emite sitemap até essa escolha ser confirmada.

## Começar localmente

Requisitos: Node.js `>=22.12.0`, pnpm `11.17.0` e Prumo `0.6.0` para gates do projeto.

```bash
pnpm install --frozen-lockfile --ignore-scripts
pnpm dev
```

## Verificar e gerar o site

```bash
pnpm check
pnpm test
pnpm build
pnpm preview
```

A saída de produção estática fica em `dist/`. Não é necessário adapter SSR. `pnpm test` valida a existência das rotas bilíngues, o manifesto de fontes, os avisos de licença e os links internos do HTML gerado.

## Fontes de documentação

`docs/sources.json` lista cada documento público permitido, sua revisão, blob, licença e destino local. Os repositórios de Ori e Aipo seguem canônicos e não são alterados por este site. Leia também [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

## Governança Prumo

- [Roteador da documentação](docs/PRUMO.md)
- [Goal P00-G01](.ai/goals/P00/P00-G01.goal.json)
- [Estado atual](PROJECT_STATE.md)
- Validar o scaffold: `prumo validate .` e `prumo doctor .`
