# Escopo do Site Poppy Team

## Nesta prova técnica

- Home editorial bilíngue: PT-BR na raiz e inglês em `/en/`.
- Páginas bilíngues para Ori, Aipo, Oride e Prumo.
- Exemplos de código e diagramas apresentados apenas como texto estático.
- Índice de blog/caderno e um artigo Markdown em cada idioma.
- Starlight em `/docs/` e `/en/docs/`.
- Allow-list local com quatro documentos públicos (dois projetos, cada qual em PT/EN), commits e blobs fixados e licença MIT.
- Layout responsivo, landmarks semânticos, navegação por teclado, foco visível, `prefers-reduced-motion` e metadados básicos.
- Testes estáticos de Node para cobertura de rotas, paridade de conteúdo, avisos de licenças e links locais gerados.
- Build Astro `output: static`, sem adapter de servidor.

## Fora desta fatia

- Compilar ou executar Ori/Aipo no navegador, playground, WebAssembly ou runtime.
- CMS, autenticação, banco de dados, APIs, analytics, comentários ou busca remota.
- Importação integral ou automática de repositórios de documentação.
- Adapter SSR, deploy, configuração de DNS ou mudança de nameservers.
- Definição final de marca, política comercial de hospedagem ou conteúdo institucional não confirmado.

## Regra de expansão

Uma página de documentação só entra depois de ser aprovada, ter idioma confirmado e aparecer explicitamente em `docs/sources.json` com caminho, revisão, hash de blob, destino e licença. As fontes originais continuam canônicas.
