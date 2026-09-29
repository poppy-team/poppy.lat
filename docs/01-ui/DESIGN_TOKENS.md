# Tokens de interface — Poppy Team

Tokens iniciais em `site/.vitepress/theme/tokens.css` e `site/.vitepress/theme/custom.css`. São uma direção de protótipo, não uma identidade de marca final.

## Cor

| Token | Valor | Uso |
| --- | --- | --- |
| `--color-paper` | `#f1eddf` | Fundo principal, papel quente |
| `--color-paper-light` | `#f8f5eb` | Contraste em controles escuros |
| `--color-ink` | `#262a25` | Texto principal, sem preto absoluto |
| `--color-ink-soft` | `#4b4e46` | Texto secundário |
| `--color-ink-muted` | `#707166` | Metadados e notas |
| `--color-rule` | `#c9c5b8` | Divisores e contornos |
| `--color-accent` | `#a33b2c` | Destaque editorial ferrugem |
| `--color-leaf` | `#33483f` | Plano visual de Ori no tema escuro |
| `--color-leaf-pale` | `#d9e0d3` | Plano visual de Ori |
| `--color-blue-pale` | `#d8dfe3` | Plano visual de Aipo |
| `--color-oride-pale` | `#e3dccd` | Plano visual de Oride |
| `--color-prumo-pale` | `#dcd8e0` | Plano visual de Prumo |

Cada plano tem uma cor de tinta própria (`--project-ink`) usada para marcar
links e acentos da seção, e uma variante escura derivada com `color-mix`, para
que a identidade sobreviva à troca de tema.

A identidade é ativada por `html[data-project='<slug>']` em
`site/.vitepress/theme/tokens.css`, a partir do `project` declarado no frontmatter
da página. Os tokens `--vp-*` do VitePress são mapeados para essa paleta em
`site/.vitepress/theme/custom.css`.

## Tipografia

- Display editorial: serif de sistema (`Iowan Old Style`, Palatino, Georgia).
- Leitura e navegação: sans-serif do sistema.
- Código e metadados: mono de sistema.
- Corpo com altura de linha ampla; display grande usa entrelinha curta.

## Espaço e layout

- Escala em múltiplos simples entre `0.5rem` e `6rem`.
- Conteúdo até `76rem`, com gutter responsivo.
- Grid assimétrico para hero e projetos em destaque; colunas colapsam para uma coluna em mobile.

## Movimento e foco

- Animação de entrada curta, limitada a opacidade e transformação.
- `prefers-reduced-motion` remove animações e rolagem suave.
- Foco de teclado usa contorno sólido de `3px` no token de destaque.

## Convenção CSS

CSS global com cascade layers (`reset`, `tokens`, `base`, `objects`, `components`, `utilities`), nomes por função e BEM-like nos componentes. Seletores permanecem rasos; não usar estilo dependente de profundidade incidental do DOM.
