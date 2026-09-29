# Escopo do Site Poppy Team

## Nesta prova técnica

- Home editorial bilíngue: PT-BR na raiz e inglês em `/en/`.
- Páginas bilíngues para Ori, Aipo, Oride e Prumo.
- Exemplos de código e diagramas apresentados apenas como texto estático.
- Índice de caderno e um artigo Markdown em cada idioma.
- Documentação em `/docs/` e `/en/docs/`, com uma seção por projeto e navegação própria para cada uma.
- Cada seção de documentação organizada em três categorias: guia de uso, novidades e planos, e desenvolvimento.
- Identidade visual por projeto: cor de destaque, landing e navegação dedicadas, preservadas nos temas claro e escuro.
- Integração nos dois sentidos: a página do projeto lista suas páginas de documentação, e cada página de documentação leva de volta ao projeto e ao repositório canônico.
- Allow-list local com a documentação pública de quatro projetos, commits e blobs fixados e licença MIT, publicada em `/sources.json`.
- Layout responsivo, landmarks semânticos, navegação por teclado, foco visível, `prefers-reduced-motion` e metadados básicos.
- Testes estáticos com Vitest para cobertura de rotas, proveniência, integração, paridade de idioma, identidade visual e links locais gerados.
- Build VitePress estático, sem adapter de servidor.

## Fora desta fatia

- Compilar ou executar Ori, Aipo, Oride ou Prumo no navegador, playground, WebAssembly ou runtime.
- CMS, autenticação, banco de dados, APIs, analytics, comentários ou busca remota.
- Importação integral ou automática de repositórios de documentação.
- Traduzir para inglês a documentação que ainda não tem versão na origem.
- Adapter SSR, alteração de DNS ou mudança de nameservers.
- Definição final de marca, domínio público, política comercial de hospedagem ou conteúdo institucional não confirmado.

## Regra de expansão

Uma página de documentação só entra depois de ser aprovada, ter idioma confirmado e aparecer explicitamente em `site/public/sources.json` com caminho, revisão, hash de blob, destino, categoria e licença. As fontes originais continuam canônicas.

Uma página cuja origem ainda não tem versão em inglês entra com o status `translation-pending` e um stub que aponta a versão em português e a fonte canônica, em vez de duplicar texto não traduzido.
