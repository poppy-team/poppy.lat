# ADR 002: Site estático bilíngue e documentação com allow-list

## Status

Aceito — Goal `P00-G01`.

## Contexto

A Poppy Team precisa apresentar projetos e oferecer documentação pública em português e inglês. Ori e Aipo possuem repositórios próprios que seguem sendo fontes canônicas. Conteúdo amplo, automaticamente descoberto, pode expor documentos internos ou ficar desatualizado sem rastreio.

## Decisão

- Usar Astro + TypeScript + Starlight com saída estática e sem adapter SSR.
- Desativar a rota 404 interna do Starlight e usar uma página 404 única com o layout geral.
- Manter o sitemap desativado enquanto o domínio canônico do site não estiver confirmado.
- PT-BR fica na raiz; páginas equivalentes em inglês ficam sob `/en/`.
- Starlight publica documentação em `/docs/` e `/en/docs/`.
- Importar somente páginas listadas em `docs/sources.json`, com commit e blob de origem fixados.
- Preservar avisos de licença MIT e declarar em cada cópia seu repositório e sua revisão.
- Não executar Ori/Aipo no browser; exemplos são conteúdo estático.

## Alternativas consideradas

1. **Vincular todos os textos diretamente aos sites upstream:** reduz duplicação, mas não cria uma experiência de leitura consolidada nem garante paridade das rotas.
2. **Importar recursivamente as pastas de docs:** menos trabalho inicial, mas mistura material interno e público e remove o controle por página.
3. **Site dinâmico com CMS/SSR:** não é necessário para o conteúdo editorial desta fase e acrescenta operação e serviços externos.

## Consequências

- HTML pré-renderizado pode ser hospedado como site estático.
- O conteúdo duplicado exige atualização deliberada, mas a proveniência e o escopo ficam verificáveis.
- Rotas devem manter paridade de idioma quando a página for pública nas duas línguas.
- Mudanças em domínio, finalidade comercial ou execução de código exigem nova decisão e revisão de segurança.
- A publicação futura deve definir a URL canônica para ativar sitemap e metadados de origem quando necessário.
