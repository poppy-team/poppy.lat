# Changelog

Todas as alterações notáveis deste projeto são documentadas neste arquivo.
O formato baseia-se no [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) e adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [0.3.0] - 2026-09-28

### Adicionado
- Badge de status nos cards de destaque e nas páginas de projeto, no espírito do que o site do Ori traz: uma etapa de maturidade e duas ou três palavras de posicionamento, por projeto.
- A placa de amostra de código passa a mostrar também a saída do programa, como uma linha de terminal sob o código, para que a amostra se leia como entrada e resultado.
- A ação primária do card de destaque — ler a documentação — passa a ser um botão sólido, e o link para a página do projeto permanece um link discreto.
- Script `map-upstream-docs.ts`, que mapeia a árvore de documentação de cada repositório de projeto e mostra quanto dela está na allow-list.
- Script `derive-allowlist.ts`, que compara a allow-list com o `srcExclude` declarado pelo próprio projeto no config do site dele, e reporta a cobertura.


- Seção de documentação própria para cada um dos quatro projetos, em `/docs/<projeto>/` e `/en/docs/<projeto>/`, com landing, índice por categoria e navegação dedicada.
- Taxonomia documental de três categorias: guia de uso, novidades e planos, e desenvolvimento.
- Integração nos dois sentidos: a página de cada projeto lista suas páginas de documentação, e cada página de documentação leva de volta à página do projeto e ao repositório canônico.
- Comutador global de projeto no cabeçalho da documentação, com a cor de cada projeto.
- Identidade visual por projeto, com planos próprios para Oride (`--color-oride-pale`) e Prumo (`--color-prumo-pale`) e variantes para o tema escuro.
- Documentação importada de Oride e Prumo, com allow-list ampliada de dois para quatro projetos e `schemaVersion` 2 no manifesto, incluindo a categoria de cada página.
- Stub explícito, com aviso de pendência e links para a versão em português e a fonte canônica, para páginas cuja origem ainda não tem tradução em inglês.
- ADR 003 e goal P01-G01, e goal P00-G01 concluído.
- Scripts de conteúdo derivado: importação da allow-list, geração de stubs de rota, geração do manifesto e publicação da página 404.
- Suíte Vitest com 20 asserções sobre o HTML emitido, incluindo paridade de idioma, integração bidirecional, identidade por projeto e resolução de todos os links internos.
- Suíte Playwright com 60 verificações em navegador, sobre um build e um servidor de preview próprios, cobrindo a separação entre páginas editoriais e de documentação, o destaque dos projetos na home, sobreposição de título, identidade por projeto, navegação por teclado, chrome em telas estreitas, contraste de texto no tema escuro e ausência de rolagem horizontal.
- Geração de capturas de tela de todas as páginas em tema claro e escuro, desktop e celular, por `pnpm screenshots`.

### Alterado
- Plataforma do site migrada de Astro + Starlight para VitePress + Vue 3, com saída estática e sem adapter de servidor.
- `packages/project-data/` passou a ser a fonte única de dados de projeto, copy i18n e taxonomia documental, consumida pelo tema e pelos scripts.
- A rota `/projetos/<slug>/` passou a ser `/projects/<slug>/`; as rotas `/en/` e de documentação mantêm o esquema anterior.
- Manifesto de fontes publicado em `/sources.json` e avisos de licença em `/third-party-notices.txt`, ambos gerados a partir do registro tipado.
- Estratégia de testes e governança de repositório reescritas para as ferramentas reais do projeto, removendo referências herdadas a ferramentas Go.
- Build habilitando a checagem de links mortos do VitePress, que reprova a publicação quando um link interno não resolve.

### Removido
- Componentes Astro, coleção de conteúdo, `astro.config.mjs` e o tema Starlight.
- Documentação interna do repositório saiu da árvore publicada e passou a viver em `docs/`.

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
- A allow-list alcançava arquivos fora da árvore de documentação: o changelog do Oride, o roadmap do Oride e o changelog do Prumo ficam na raiz dos repositórios, e nenhum dos três projetos publica esses arquivos no site próprio. As três páginas foram removidas, porque reach outside the documentation tree is what the curation rule exists to prevent.
- A escolha das páginas importadas não tinha critério declarado. Os repositórios de Aipo e Prumo publicam a configuração do site próprio, e a lista `srcExclude` dela é exatamente o conjunto que o projeto decidiu não publicar. Dois scripts medem a allow-list contra esse critério e tornam a lacuna visível.


- A documentação saiu de `/docs/<projeto>/` para `/<projeto>/docs/`, para que cada projeto tenha um subsite próprio e o índice compartilhado, que só repetia o que a seção de projetos já mostra, deixasse de existir.
- Os valores do badge de status são propostas, não dados verificados: `S3` do Ori vem do site do Ori, os demais foram sugeridos e precisam de confirmação.


- O rótulo do botão de documentação foi reescrito na migração para VitePress. Ori e Aipo mantinham a frase original; Oride e Prumo, que antes apontavam para o repositório porque não tinham documentação, receberam a mesma frase dos outros dois, já que agora têm. A formulação do autor original volta a ser a dos quatro.
- Os dois projetos principais perderam o destaque de card na home: viraram faixas de lista, sem altura, sem cor por projeto e sem área própria. O grid assimétrico e os planos de cor de Ori e Aipo foram restaurados, com um link direto para a documentação de cada um.
- Oride e Prumo apareciam na home sem nome, só com número e categoria. Os dois têm agora o nome como título e link para a página do projeto.
- A seção secundária da home não tinha título próprio, o que a deixava indistinguível do rodapé do catálogo.


- Na documentação em telas estreitas, o cabeçalho da marca era empilhado acima da navbar de documentação, empurrando o título da página para baixo. O cabeçalho é ocultado nessa faixa, onde a navbar já carrega o nome e o comutador de idioma, e o seletor de projeto passa a funcionar como navegação de rodapé.
- No tema escuro, os textos secundários usavam tintas claras escolhidas para o papel claro e ficavam abaixo da relação mínima de 4.5:1. As tintas suave e apagada são remapeadas para a mesma escala de cinzas que a documentação já usa.
- O cartão de fechamento da home mantinha o fundo claro no tema escuro, deixando o texto ilegível.
- A home e as páginas de projeto apareciam como páginas de documentação: a barra lateral, a barra de busca e a navegação de docs eram herdadas do tema do VitePress. O tipo de página agora é marcado no HTML durante o build e o chrome de documentação é ocultado nas páginas editoriais.
- O `h1` da home se sobrepunha ao parágrafo seguinte, porque o tema base define um entrelinhamento baixo para títulos grandes.
- O rodapé não era renderizado nas páginas de documentação nativas nem na página 404, porque cada tipo de layout do VitePress expõe um conjunto diferente de slots.
- O seletor de projeto ultrapassava a largura da janela em telas a partir de 1440px, causando rolagem horizontal.
- No tema escuro, os cartões de documentação mantinham o fundo claro e o título ficava ilegível.


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
