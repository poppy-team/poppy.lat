# Catálogo de componentes

## Componentes Vue

| Componente | Responsabilidade | Interação |
| --- | --- | --- |
| `SiteShell` | Layout raiz: registra o tema e injeta o chrome nas páginas de layouts nativos | nenhum |
| `SiteChrome` | Skip link, cabeçalho de marca, navegação primária, comutador de idioma e de projeto, e o cabeçalho do projeto em páginas de documentação | links nativos com foco visível |
| `SiteFooter` | Rodapé com marca, descrição, links externos e copyright | links nativos |
| `ProjectSwitcher` | Navegação entre as seções de documentação dos quatro projetos | links nativos, cor por projeto |
| `DocsProjectHeader` | Cabeçalho de uma página de documentação: nome do projeto, link de volta à página do projeto e ao repositório | links nativos |

## Layouts

| Layout | Rota | Responsabilidade |
| --- | --- | --- |
| `site-home` | `/` e `/en/` | Hero, projetos em destaque e secundários, e chamada para a documentação |
| `project-page` | `/projects/<slug>/` | Propósito, princípios, exemplo estático e a lista de páginas de documentação do projeto |
| `docs-landing` | `/docs/<slug>/` | Identificação do projeto e suas páginas, agrupadas por categoria |
| `docs-category` | `/docs/<slug>/<categoria>/` | Índice de uma categoria e navegação para as outras categorias que têm páginas |
| `blog-index` | `/blog/` e `/en/blog/` | Índice do blog |
| `article` | `/blog/<slug>/` | Nota do blog com data e descrição |
| `not-found` | `/not-found/` | Página de erro, publicada também como `404.html` |

O tema nativo do VitePress cobre a navegação lateral, a busca local, a tabela de
conteúdo e os temas claro e escuro das páginas de documentação.

## Blocos de estilo

Os componentes abaixo existem como classes em `site/.vitepress/theme/custom.css`,
não como arquivos próprios. Estão listados aqui porque têm responsabilidade
própria e mais de um uso.

| Bloco | Responsabilidade |
| --- | --- |
| `project-feature` | Projeto em destaque na home |
| `secondary-project` | Projeto secundário na home |
| `project-page` | Página editorial de projeto |
| `code-plate` | Amostra de código estática com rótulo e linguagem |
| `docs-card` | Ligação para uma página de documentação, com título e descrição |
| `docs-landing` | Seção de documentação de um projeto |
| `journal-page` / `article-page` | Blog e nota individual |
| `site-header` / `site-footer` | Chrome do site |

## Regras

- O catálogo é específico desta fatia; componentes adicionais só devem ser
  extraídos quando existir um segundo uso real.
- O texto editorial vem de `packages/project-data`; um layout não escreve copy.
- Nenhum layout declara `data-project`: ele é lido do frontmatter e aplicado pelo
  shell, para que a identidade não dependa da URL.
