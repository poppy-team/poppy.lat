# ADR 003: VitePress como plataforma de documentação, site em Vue

## Status

Aceito — substitui a decisão de plataforma registrada na ADR 002. Goal `P01-G01`.

## Contexto

A ADR 002 fixou Astro + Starlight para a documentação. A site passou a precisar de
personalização visual por projeto: cada um dos quatro projetos da Poppy Team
precisa de identidade própria (cor de destaque, landing, sidebar dedicada) e de
integração nos dois sentidos com sua página editorial.

No Starlight, essa personalização exigiria principalmente CSS com escopo de rota
sobre variantes internas do framework, sem poder reescrever header, sidebar ou
landing. Além disso, Oride e Prumo passaram a ter documentação importada, e a
allow-list cresceu de 2 para 4 projetos com taxonomia de três categorias.

## Decisão

- Migrar **todo** o site para VitePress + Vue 3 com saída estática, sem adapter SSR.
- A árvore de arquivos em `site/` é o mapa de rotas; PT-BR na raiz e inglês sob `en/`.
- `packages/project-data/` é a fonte única de dados de projeto, cópia editorial e
  taxonomia documental, consumida pelo tema e pelos scripts de geração.
- Scripts em `scripts/` geram conteúdo derivado: importação da allow-list, stubs
  de rota, manifesto de fontes e a página 404 publicada.
- A documentação de cada projeto é organizada em três categorias: `guides`
  (uso), `roadmap` (novidades e planos) e `development` (contribuição).
- Cada página declara `project` no frontmatter; o shell deriva a identidade visual
  desse atributo, sem adivinhar a partir da URL.
- Página sem tradução em inglês recebe um stub explícito que aponta a versão em
  português e a fonte canônica, em vez de duplicar texto não traduzido.
- PT-BR e `/en/` mantêm o esquema de URL anterior, exceto `/projetos/<slug>/`,
  que passa a `/projects/<slug>/`; a troca exige redirect no host.

## Alternativas consideradas

1. **Permanecer no Starlight com tema por rota.** Entregaria os quatro requisitos
   (sidebar, landing, identidade, integração) com menos trabalho e um build só,
   ao custo de não poder reescrever o shell. Descartado porque a personalização
   por projeto é o objetivo central do trabalho, não um detalhe.
2. **Híbrido Astro (site) + VitePress (docs).** Mantém o site existente e troca
   apenas a documentação, mas gera dois builds, dois outputs e duas implantações,
   além de exigir um pacote compartilhado e reescrever os testes. Descartado
   porque o custo operacional não se justifica para quatro projetos.
3. **Docusaurus.** Excelente i18n e ecossistema de plugins, porém React e muito
   mais pesado do que o conteúdo atual exige.
4. **Fumadocs (Next.js).** A opção mais personalizável, mas abandona a saída
   estática e exige hospedagem com SSR.
5. **Rspress.** Alternativa moderna e rápida, com menos ecossistema que Docusaurus.

## Consequências

- A documentação e o editorial passam a compartilhar tema, tokens e componentes.
- Os componentes Astro e o content collection são removidos; a lógica de
  apresentação vira SFC Vue, com verificação de tipos por `vue-tsc`.
- A suíte de testes é reescrita em Vitest e passa a cobrir site e documentação
  no mesmo `dist/`, incluindo paridade de idioma e integração bidirecional.
- A URL `/projetos/<slug>/` muda para `/projects/<slug>/`; links externos para a
  forma antiga precisam de redirect no host.
- A busca passa a ser o índice local do VitePress, sem serviço remoto.
- VitePress reserva `404.md` e não pré-renderiza seu corpo; a página 404 é
  publicada por script a partir da rota `/not-found/`.
- A documentação interna do repositório vive em `docs/` e não é publicada.
- Mudanças em domínio, finalidade comercial ou execução de código continuam
  exigindo nova decisão e revisão de segurança.

## Reversão

A migração é reversível: a plataforma anterior permanece registrada na ADR 002 e
o conteúdo importado é derivado por script a partir das fontes canônicas, sem
perda de material. Reverter exige restaurar os componentes Astro a partir do
histórico Git e reexecutar a importação com outro destino.
