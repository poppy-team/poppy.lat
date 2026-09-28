# Convenções de nomes HTML/CSS

## HTML

- IDs são reservados a âncoras únicas e relações programáticas, como `main-content`, `home-title` e `projects-title`.
- Classes descrevem componente e responsabilidade: `site-header`, `project-page__hero`, `journal-list__index`.
- A chave `translationKey` no frontmatter do blog liga as versões traduzidas sem exigir slugs iguais.
- Navegação e ações usam links nativos com destino claro; atributos ARIA são usados só para nomear landmarks ou descrever SVGs quando o HTML não basta.

## CSS

O CSS global usa nomes BEM-like leves:

- bloco: `.project-feature`;
- elemento: `.project-feature__header`;
- modificador: `.project-feature--ori`.

Não usar prefixos de framework, seletores de profundidade de DOM, nomes puramente visuais sem semântica ou hooks de JavaScript sem necessidade.
