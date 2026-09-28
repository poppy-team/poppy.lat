# Changelog

Todas as alterações notáveis deste projeto são documentadas neste arquivo.
O formato baseia-se no [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) e adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [0.2.0] - 2026-09-28

### Adicionado
- Goal P00-G01 para prova estática Astro + TypeScript + Starlight bilíngue.
- Home editorial PT-BR/EN, páginas estáticas para Ori, Aipo, Oride e Prumo e caderno Markdown.
- Documentação Starlight em `/docs/` e `/en/docs/`, com allow-list versionada de páginas públicas Ori/Aipo e avisos MIT.
- Design tokens e arquitetura documentada de HTML, CSS, conteúdo e fontes.
- Testes nativos de Node para rotas estáticas, proveniência de fontes e links internos.
- Marca da Poppy Team em `src/assets/poppy-logo.svg`, exibida no cabeçalho do site e no cabeçalho da documentação Starlight.
- Variante escura da marca em `src/assets/poppy-logo-dark.svg`, usada pelo Starlight no tema escuro, e teste que impede divergência de geometria entre as duas.
- Breakpoint de `1100px` para o rodapé e o hero em telas médias e de `400px` para telas estreitas.

### Corrigido
- Removida a prop `availableLocales`, que era calculada e repassada sem uso nas páginas de artigo, mantendo `astro check` sem erros.

### Alterado
- Raiz do SVG da marca normalizada: unidades em pixel em vez de milímetros, `width`/`height` proporcionais ao `viewBox` e remoção de metadados do editor Inkscape (inclusive a referência de exportação a um arquivo de logo do Ori). A rasterização antes e depois é idêntica.
- Alvos de toque da navegação, quebra de palavras em títulos e piso de layout reduzido para `280px`.

### Alterado
- Perfil e manifesto Prumo atualizados para Astro, Starlight, TypeScript e Markdown.
- Cópias de Ori/Aipo destacadas como texto simples em blocos de código, mantendo os identificadores de linguagem visíveis.

## [0.1.0] - 2026-09-28

### Adicionado
- Inicialização da estrutura canônica do Prumo v0.6.0.
- Configuração do manifesto `prumo.json` e orquestração `.ai/`.
- Definição da hierarquia de documentação canônica em `docs/`.
- Contrato estrito de arquitetura em `docs/architecture/clean-code-contract.md`.
- Estratégia de testes exaustivos em `docs/development/testing-strategy.md` (unitários, integração, conformidade, segurança SAST/secrets, performance/stress, UI).
- Política de documentação mandatória com `README.md` explicativo em cada diretório do projeto.
