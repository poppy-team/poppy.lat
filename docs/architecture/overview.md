# Visão de Arquitetura

## Topologia

```text
Conteúdo Markdown local ─┐
Dados tipados de projetos ├─> Astro + TypeScript ─> HTML estático
Documentos allow-listed ─┘          │
                                    └─ Starlight em /docs e /en/docs
```

- `src/pages/`: rotas estáticas para home, projetos, blog e manifestos públicos.
- `src/components/`: layout compartilhado e páginas de projeto reutilizáveis.
- `src/data/`: cópia editorial de descrições curtas e dados tipados de navegação/projeto.
- `src/content/blog/`: caderno Markdown com schema, locale e chave explícita de correspondência entre traduções.
- `src/content/docs/`: páginas Starlight, incluindo cópias selecionadas das fontes externas.
- `src/content/i18n/`: sobrescritas localizadas de rótulos de interface do Starlight.
- `src/pages/404.astro`: página estática de erro 404 do site; a rota 404 integrada do Starlight fica desativada para evitar colisão.
- `docs/sources.json`: allow-list, revisões Git e blobs de cada página importada; o endpoint `/docs/sources.json` a serve no build estático.
- `THIRD_PARTY_NOTICES.md`: avisos de copyright e licenças das fontes redistribuídas; a rota `/third-party-notices.md` serve o conteúdo original como texto Markdown no build estático.
- `tests/static-site.test.mjs`: testes nativos de Node para rotas, proveniência e links internos.

## Renderização e idioma

Astro gera HTML sem adapter de servidor. PT-BR é o idioma raiz; inglês usa prefixo `/en/`. O sitemap depende de uma URL canônica do site, ainda não definida; por isso, o build não o emite. Starlight usa a localidade `root` para as páginas portuguesas, com conteúdo dentro do subdiretório `docs/`, e `en` para as páginas inglesas em `en/docs/`.

## Fontes canônicas

Os repositórios `poppy-team/ori-lang` e `poppy-team/aipo-lang` são fontes canônicas. O site contém cópias estáticas curadas, identificadas por commit e blob. Uma mudança no upstream só chega ao site por uma atualização explícita da allow-list, do conteúdo local e dos avisos.

## Limites de execução

Exemplos de Ori e Aipo são blocos de texto. O browser não recebe compilador, runtime, WASM ou API de execução. O site não possui backend ou estado de usuário nesta fatia.
