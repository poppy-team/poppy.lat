# Painel administrativo do Aprender

Data: 2026-09-30. Complementa o [plano do Aprender](aprender-plano.md), a [biblioteca](aprender-biblioteca.md) e a [comunidade](aprender-comunidade.md). É um desenho: **nada disto está implementado além do que a seção 7 diz.**

> **Em uma frase:** um painel pequeno, só para a equipe, para cuidar de **pessoas e conteúdo** (usuários, posts do blog, aulas com vídeo e imagem, moderação do fórum e dos comentários) sem tocar no visual nem na configuração do site.

---

## 1. O que o painel é e o que não é

**É:** um lugar em `/conta/admin` para quem é da equipe fazer o que hoje exigiria mexer em arquivos, no banco ou esperar uma publicação.

**Não é:** editor do site, da aparência, dos textos fixos da home, das chaves, do domínio ou de qualquer configuração. Isso continua no repositório, com revisão. Essa fronteira é proposital: o painel só toca em **conteúdo e pessoas**, então um erro nele nunca derruba o site.

## 2. Quem entra

| Papel | Vê e faz |
|---|---|
| **Admin** | Tudo abaixo |
| **Contribuidor** | Moderação (já existe), escrever rascunhos de aulas e posts; **não publica** e não mexe em usuários |
| **Aluno** | Nada do painel |

Regras de segurança desde o primeiro dia: a verificação de papel acontece **no servidor** em cada rota (a tela escondida não protege nada); ações destrutivas pedem confirmação; toda ação de admin vai para o **registro de auditoria** (quem, o quê, quando, valor anterior); e, antes de abrir para mais de uma pessoa, a equipe entra com **segundo fator** (TOTP), que já está na lista de pendências.

## 3. As seções

### 3.1 Usuários
Lista com busca por nome, apelido ou e-mail. Ver papel, data de entrada, última atividade e quantidade de comentários. Ações: trocar papel, **suspender** (a pessoa continua vendo, mas não comenta) e **atender pedido de exclusão de dados** (LGPD), que apaga conta, perfil, anotações e progresso e anonimiza os comentários. Nunca mostra anotações nem fotos: são privadas.

### 3.2 Blog
Posts em Markdown com título, resumo, data, imagem de capa e estado (**rascunho**, **publicado**, **agendado**). Prévia igual à página final. O Markdown passa pelo mesmo tratamento de segurança dos comentários: sem HTML cru, links externos com `rel` seguro.

### 3.3 Aulas
É a parte mais pedida e a mais delicada, por isso tem seção própria (4). Em resumo: criar curso, módulo e lição; escrever o texto em Markdown; colocar **link de vídeo**; subir **imagens**; ordenar; marcar como disponível ou "em breve"; pré-visualizar com a cara de aula.

### 3.4 Fórum e comentários
A moderação que já existe (denúncias, esconder, fixar, registro) passa a morar aqui, com o fórum quando ele existir. Nada novo a construir agora além de trazer a tela para o painel e ligar ao mesmo registro de auditoria.

### 3.5 Registro de auditoria
Linha do tempo só de leitura de tudo que o painel fez, com filtro por pessoa e por tipo. Serve para achar um erro, desfazer à mão e prestar contas.

## 4. Aulas: o ponto que muda a arquitetura

Hoje uma aula é **um arquivo Markdown no repositório** e o catálogo está em `courses.ts`. Isso é ótimo para revisão e para a apostila gerada no build, mas significa que inserir uma aula exige commit e publicação. Para inserir pelo painel, o conteúdo precisa morar no banco. Há três caminhos:

| Caminho | Como funciona | Prós | Contras |
|---|---|---|---|
| **A. Tudo no banco** | Aulas viram linhas; o site as mostra em uma rota dinâmica | Publica na hora, sem deploy | Perde revisão por pull request e o HTML pronto no build; a apostila precisa de outro gerador |
| **B. O painel escreve no GitHub** | O painel abre um commit/PR no repositório; o deploy publica | Mantém revisão, histórico e apostila | Publicar continua dependendo do deploy manual; exige uma GitHub App |
| **C. Híbrido (recomendado)** | As aulas da Poppy continuam no repositório. As aulas e cursos inseridos pelo painel ficam no banco e aparecem em uma rota dinâmica (`/aprender/ao-vivo/…`) que usa o mesmo visual, barra, pager, vídeo e anotações | Resolve o pedido de inserir aula na hora sem abrir mão do que já funciona; dá para promover uma aula do banco para o repositório depois | Duas fontes de aulas; a rota dinâmica não tem HTML pronto (aceitável para conteúdo novo, e dá para pré-renderizar depois) |

**Recomendação:** C, em fases, começando pelo que dá valor mais rápido e com menos risco.

### Vídeo
Campo "link do vídeo". O servidor aceita só endereços de uma lista fixa (hoje: YouTube) e guarda o **código do vídeo**, não o endereço colado. A página mostra o vídeo com **carregar ao clique** e `youtube-nocookie.com`, junto de título, **transcrição** e descrição do que se aprende (regra do [plano de vídeo](aprender-acessibilidade-e-video.md)). O CSP do site ganha `frame-src` só para esse domínio.

### Imagens
Envio de JPG, PNG ou WebP, reprocessado no servidor (como as fotos de perfil: limite de tamanho, reencode para WebP, sem metadados), com **texto alternativo obrigatório** para publicar. Armazenamento: começar no próprio banco (é o que já fazemos com fotos); se o volume crescer, migrar para um armazenamento de objetos.

### Texto da aula
Markdown com um conjunto fechado de recursos (títulos, listas, código com abas Ori/Aipo, caixas de dica/atenção, imagem, vídeo). Sem HTML livre. O mesmo conteúdo alimenta a apostila em Markdown.

## 5. Modelo de dados (rascunho)

- `posts` (id, slug, título, resumo, corpo_md, capa_id, estado, publicado_em, autor_id, criado/atualizado)
- `courses`, `course_modules`, `lessons` (ordem, estado, minutos, corpo_md, vídeo_provedor, vídeo_id, transcrição_md, autor_id)
- `media` (id, dono_id, mime, bytes, alt, criado_em)
- `audit_log` (id, ator_id, ação, alvo_tipo, alvo_id, antes, depois, criado_em)
- `users.suspended_at`

Todas com migração escrita à mão, como as atuais, e testes do servidor para cada regra de permissão.

## 6. Fases

1. **Base**: rota `/conta/admin`, guarda de papel no servidor, registro de auditoria, e **Usuários** (lista, papel, suspender). Move a moderação para dentro.
2. **Blog no banco**: editor Markdown com prévia, rascunho/publicado, imagem de capa. Mesma renderização segura dos comentários.
3. **Aulas e cursos no banco**: rota dinâmica, editor, ordenação, **vídeo** e **imagens**, prévia.
4. **Fórum**: quando existir, a moderação dele entra no painel.
5. **Endurecer**: TOTP para a equipe, exportação do registro, limites de taxa por ação.

Cada fase é um PR pequeno, com testes, e pode ser usada sozinha.

## 7. Estado

Só este documento. As bases que já existem e o painel vai reaproveitar: papéis (`student`, `contributor`, `admin`), a moderação com registro, o tratamento de Markdown seguro dos comentários e o reprocessamento de imagens das fotos de perfil.

## 8. O que falta você decidir

1. **Aulas: caminho C (híbrido)?** É a recomendação. Se preferir manter tudo revisado no GitHub, o caminho B serve, mas publicar continua dependendo do deploy.
2. **Quem publica?** Sugestão: só admin publica; contribuidores escrevem rascunhos.
3. **Vídeo:** só YouTube por enquanto, ou já incluir outros provedores?
4. **Por onde começar?** Sugestão: fases 1 e 2 (usuários e blog), que não mexem na estrutura das aulas.
