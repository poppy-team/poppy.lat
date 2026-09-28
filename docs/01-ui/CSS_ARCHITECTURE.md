# Arquitetura CSS

## Folhas de estilo

- `src/styles/site.css`: tokens e componentes das páginas Astro da marca.
- `src/styles/docs.css`: overrides pequenos de tokens e foco para Starlight.

## Organização

`site.css` usa cascade layers em ordem: `reset`, `tokens`, `base`, `objects`, `components`, `utilities`. Componentes globais recebem classes nomeadas pela função, por exemplo `project-feature__body` e `site-nav`.

## Responsividade

O layout usa CSS Grid para hierarquias bidimensionais, flex para alinhamentos e quatro breakpoints decrescentes, declarados nessa ordem no fim do arquivo: `1100px` (rodapé em duas colunas e hero mais compacto), `850px` (cabeçalho empilhado, catálogo em duas colunas, índice do caderno reordenado), `600px` (uma coluna e tipografia menor) e `400px` (gutters, marca e títulos reduzidos).

Regras que sustentam a fluidez:

- `html { min-width: 280px }` mantém o piso do layout em telas de 280px, como a capa de dobráveis.
- Títulos usam `overflow-wrap: break-word`, de modo que nenhuma palavra longa force a largura da página.
- Os itens de navegação viram `inline-flex` com `min-height: 2.75rem` a partir de `850px`, garantindo alvos de toque confortáveis.
- Blocos de código rolam sozinhos (`overflow-x: auto`) e nunca expandem o documento.

O gatilho mais estreito para títulos grandes é o hero: em duas colunas a largura útil da cópia chega ao mínimo por volta de `600px`, então o `clamp()` do `h1` é reduzido nessa faixa e novamente em `400px`.

## Movimento e interação

A única animação de entrada usa `opacity` e `transform`. Um bloco `prefers-reduced-motion: reduce` desliga animações, transições e rolagem suave. Links possuem estado de hover e contorno de foco explícito.
