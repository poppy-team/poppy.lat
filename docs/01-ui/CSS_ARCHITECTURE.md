# Arquitetura CSS

## Folhas de estilo

- `site/.vitepress/theme/tokens.css`: paleta, tipografia, espaçamento e as variáveis de identidade por projeto, incluindo as variantes do tema escuro.
- `site/.vitepress/theme/custom.css`: mapeamento dos tokens do VitePress para a paleta da marca, chrome do site e componentes.

O tema nativo do VitePress fornece layout, navegação lateral, busca e tabela de
conteúdo. Essas duas folhas reaproveitam essa estrutura em vez de reimplementá-la.

## Organização

`tokens.css` declara a paleta em `:root` e, em seguida, a identidade por projeto
em `html[data-project='<slug>']`, com um bloco equivalente sob `.dark` para que a
identidade sobreviva à troca de tema. `custom.css` mapeia os tokens `--vp-*` para
essa paleta e define os componentes com classes nomeadas pela função, por exemplo
`project-feature__body` e `site-nav`.

A identidade de uma página nunca depende da URL: o shell lê o `project` do
frontmatter e o aplica como `data-project` no elemento raiz.

## Responsividade

O layout usa CSS Grid para hierarquias bidimensionais e flex para alinhamentos, com breakpoints decrescentes em `850px` (navegação em largura total, alvos de toque maiores, projetos secundários em uma coluna) e `600px` (uma coluna e tipografia menor).

Regras que sustentam a fluidez:

- Títulos usam `overflow-wrap: break-word`, de modo que nenhuma palavra longa force a largura da página.
- Os itens de navegação viram `inline-flex` com `min-height: 2.75rem` a partir de `850px`, garantindo alvos de toque confortáveis.
- Blocos de código rolam sozinhos (`overflow-x: auto`) e nunca expandem o documento.
- As grades de cartões de documentação colapsam para uma coluna em `600px`.

## Movimento e interação

As transições são limitadas a `opacity` e `transform`. Um bloco
`prefers-reduced-motion: reduce` desliga animações, transições e rolagem suave.
Links possuem estado de hover e contorno de foco explícito de 3px, com
`outline-offset` de 3px, aplicado também ao conteúdo das páginas de documentação.
