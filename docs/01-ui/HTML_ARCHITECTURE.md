# Arquitetura HTML

## Landmarks

O layout `SiteLayout.astro` fornece `header`, `nav`, `main` com link de pulo para conteúdo e `footer`. Páginas têm um `h1` e agrupam o conteúdo por `section`, `article`, `aside`, `figure`, `ol` e `time` conforme o significado.

## Marca

O cabeçalho abre com `a.wordmark` apontando para a home do idioma. Dentro dele, `img.wordmark__logo` (`src/assets/poppy-logo.svg`) mostra a marca e `span.wordmark__text` mantém o wordmark tipográfico (`poppy` + `team / research & tools`), porque o desenho ainda não inclui texto nem fonte. A imagem é decorativa (`alt=""`): o link já tem nome acessível em `aria-label`.

A documentação Starlight reaproveita as mesmas variantes em `logo.light` e `logo.dark`, e o Starlight só renderiza a imagem do tema ativo.

As duas variantes têm exatamente a mesma geometria; a escura troca apenas os preenchimentos:

| Papel na arte | Clara | Escura |
| --- | --- | --- |
| Desenho principal | `#141313` | `#f1eddf` |
| Forma interna | `#d4b893` | `#d4b893` |
| Pupilas | `#fefefe` | `#262a25` |

Para editar o desenho: altere a variante clara, copie o arquivo para `poppy-logo-dark.svg` e reaplique as três cores. O teste `keeps the dark logo variant geometrically identical to the light one` falha se a geometria ou a paleta divergirem.

O `viewBox` inclui o desenho inteiro e nada além dele: a tinta alcança as quatro bordas do quadro (verificado rasterizando o arquivo), então não há margem a remover. `width` e `height` repetem os valores do `viewBox` para que a proporção intrínseca da imagem coincida com a do desenho, sem letra-caixa de fração de pixel.

## Fluxo de leitura

- A home apresenta introdução, projetos em destaque, iniciativas secundárias e links de documentação/caderno.
- A página de projeto apresenta retorno ao catálogo, propósito, princípios, exemplo estático e fonte.
- O caderno tem um índice cronológico e páginas individuais renderizadas de Markdown.
- Starlight controla landmarks, navegação de docs, índice de página e blocos de código. A página 404 do site usa o mesmo layout principal; a rota 404 padrão de Starlight é desativada para evitar conflito.

## Interação

Navegação usa elementos `<a>` nativos. Não há controles baseados em `div`, formulários, comportamento condicionado a mouse nem JS de cliente necessário ao fluxo principal.

## Acessibilidade

- Link para pular diretamente a `main`.
- Rótulo explícito para navegação e ilustrações.
- Hierarquia de títulos contínua.
- Foco visível, teclado nativo, idioma no elemento `html` e links com nomes compreensíveis.
- Texto alternativo para a ilustração e rótulo do exemplo de código.
