# Catálogo de componentes

## Componentes compartilhados

| Componente | Responsabilidade | Estados/interação |
| --- | --- | --- |
| `SiteLayout` | Metadados, navegação, idioma e rodapé | Links nativos, foco visível |
| `ProjectPage` | Propósito, princípios, código estático e origem | Links para GitHub/docs |
| `project-feature` | Apresentar Ori/Aipo em destaque | Hover e foco nos links |
| `secondary-project` | Apresentar Oride/Prumo de forma secundária | Hover e foco nos links |
| `journal-list` | Índice de artigos Markdown com data | Link de leitura |
| `code-plate` | Mostrar texto de exemplo com linguagem e aviso | Sem execução ou controle interativo |

## Conteúdo

Projetos e textos compartilhados estão tipados em `src/data/projects.ts` e `src/data/site-copy.ts`. Blog é uma coleção Markdown com schema em `src/content.config.ts`. Docs são servidos por Starlight.

O catálogo é específico desta fatia; componentes adicionais só devem ser extraídos quando existir um segundo uso real.
