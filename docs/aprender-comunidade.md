# Comunidade no Aprender: perfil, anotações, comentários, papéis e fórum

Data: 2026-09-30. Complementa o [plano do Aprender](aprender-plano.md). É um desenho: **nada disto é implementado agora.**

> **Em uma frase:** uma conta por pessoa, com perfil privado por padrão, anotações só suas que podem ser baixadas em Markdown com o link da lição, comentários no fim de cada lição com moderação desde o primeiro dia, e o esquema já preparado para badges, ranking, porcentagem por trilha e um micro fórum.

Maquete visual das quatro telas principais (perfil, edição do perfil, anotações e conversa): https://claude.ai/artifact/RGzhByrPc2pVNQZUuk6My5 (privada; só quem tem acesso abre).

---

## 1. Tecnologias escolhidas

O critério foi: **poucas peças, todas de código aberto, em TypeScript, que rodam nas Vercel Functions e no SQLite do Turso**, e que escondam o trabalho perigoso (senhas, sessões, HTML de usuário) em bibliotecas muito usadas, em vez de código nosso.

| Necessidade | Escolha | Por quê | Descartado |
|---|---|---|---|
| Login, sessões, papéis, banimento | **Better Auth** com o plugin `admin` (papéis e banimento), `magic link` (link por e-mail) e GitHub | Código aberto, TypeScript, adaptador para Drizzle com SQLite (`provider: "sqlite"`), token de link de uso único e com prazo (5 minutos por padrão), guardado como hash. Papéis e banimento já vêm prontos. | **Clerk** (serviço de terceiros, dados fora do nosso banco). **Lucia** (virou material de estudo, não biblioteca). **Auth.js** (adaptador SQLite assíncrono com problemas conhecidos). |
| Acesso ao banco e migrações | **Drizzle ORM** + `drizzle-kit`, driver libSQL (`dialect: turso`) | Consultas tipadas e sempre parametrizadas; migrações em arquivos `.sql` revisados em PR; o Better Auth gera o esquema de login para o Drizzle. | SQL escrito à mão em texto (risco de injeção). Prisma (mais pesado para funções pequenas). |
| Rotas da API | **Hono** com **Zod** para validar toda entrada | Muito pequeno, roda em Vercel Functions, valida corpo, parâmetros e cabeçalhos antes de tocar no banco. | Rotas soltas sem validação. |
| Editor de anotações (WYSIWYG simples) | **Tiptap** (`@tiptap/starter-kit` + `@tiptap/markdown`) | Baseado no ProseMirror, com Markdown de entrada e saída (`getMarkdown()`), barra de ferramentas própria, extensões só do que queremos. **O Markdown é a fonte da verdade**: o banco nunca guarda HTML. | Quill e editores que guardam HTML. Lexical (exigiria escrever a conversão para Markdown). |
| Modo alternativo do editor | **`<textarea>` de Markdown** com pré-visualização | Editores WYSIWYG são difíceis para leitores de tela e para quem prefere teclado. O botão "Modo Markdown" troca um pelo outro sem perder o texto. | Só WYSIWYG. |
| Mostrar Markdown de comentários e anotações | **markdown-it** (já vem com o VitePress) com `html: false`, mais **DOMPurify** como segunda camada | Nada de HTML cru; links só `http`, `https` e `mailto`, sempre com `rel="nofollow ugc noopener noreferrer"`; sem imagens em comentários. | Renderizar HTML vindo do usuário. |
| Emojis | **Unicode nativo** + **emoji-picker-element** (Apache-2.0, cerca de 12,5 kB, acessível por teclado e leitor de tela) com os dados **hospedados por nós** | O padrão dele baixa os dados de um CDN de terceiros; hospedando `emoji-picker-element-data` no site, não há chamada externa. Reações usam um conjunto fixo de 6 emojis. | Pacotes de imagens de emoji; picker que consulta CDN. |
| E-mail do link de login | **Resend** (ou outro serviço de e-mail transacional) | Chave só na Vercel; domínio com SPF/DKIM. | Servidor de e-mail próprio. |
| Foto do perfil | **Recorte e compactação no navegador** (`createImageBitmap` + `<canvas>`, saída WebP 256 × 256, menos de 40 KB) e **nova compactação no servidor** com **sharp** | O navegador economiza rede e banco; o servidor não confia nele e recodifica de novo, o que apaga metadados (localização) e recusa arquivos que não são imagem. | Guardar o arquivo original; buscar a foto do GitHub por endereço (abre a porta para SSRF e rastreio). |
| Baixar anotações | Geração **no navegador**: um `.md`, ou um `.zip` com `fflate` | Sem trabalho no servidor e sem arquivos temporários. | Gerar arquivos no servidor. |
| Anti-spam | Limite de requisições por conta e por IP (Vercel Firewall + tabela no Turso); **Cloudflare Turnstile** só se aparecer spam | Turnstile não usa quebra-cabeças de imagem, o que é melhor para acessibilidade. | CAPTCHA de imagens. |
| Tempo real | **Não agora.** Comentários carregam ao abrir e têm o botão "Atualizar" | Menos peças, menos custo, menos superfície de ataque. Dá para acrescentar depois. | WebSocket. |
| Testes | **Vitest** e **Playwright** (já no projeto) | A matriz de permissões (seção 3) vira uma tabela de testes. | — |

> Confirmar na implementação: que o papel padrão do plugin `admin` pode ser `student`, que a versão atual do Tiptap Markdown cobre a lista de recursos do editor, e as opções de expiração e somente leitura dos tokens do Turso.

**Esquema de login mudou.** As tabelas `users`, `auth_accounts` e `sessions` do plano serão substituídas pelas que o Better Auth gera (`user`, `session`, `account`, `verification`). As demais tabelas do plano (`lesson_progress`, `exercise_attempts`, `playground_snippets`) continuam e passam a apontar para `user(id)`.

---

## 2. Perfil

**Endereços:** `/aprender/perfil` (a própria pessoa, sempre completo), `/aprender/perfil/editar` (foto, dados e links) e `/aprender/u/<apelido>` (o que os outros veem, só se a pessoa liberar).

**Organização da página** (veja a aba Perfil da maquete):
- **Cartão de apresentação no topo:** faixa de cor, foto grande, nome, `@apelido`, badge de papel (**Aluno** ou **Contribuidor**), bio de até 280 caracteres, os **selos de links** e o botão "Editar perfil".
- **Índice lateral** (vira uma fileira rolável no celular): Progresso, Anotações, Atividade, Conquistas, Privacidade e Meus dados.
- **Cada seção é um cartão com a mesma forma**: título, uma frase que explica a seção e o conteúdo. Assim a pessoa sabe onde está sem ler tudo.
  1. **Progresso:** uma barra por trilha, com "5 de 21 lições · 24%" e "continue de onde parou".
  2. **Anotações:** as mais recentes, com atalhos para ver todas e baixar.
  3. **Atividade:** comentários escritos e respostas recebidas.
  4. **Conquistas:** vazio por enquanto (seção 7).
  5. **Privacidade:** perfil público, rankings e o aviso sobre a foto.
  6. **Meus dados:** baixar tudo, apagar a conta.

**Foto do perfil** (opcional; sem foto aparecem as iniciais):
1. A pessoa escolhe uma imagem (até 10 MB, só arquivo de imagem).
2. O navegador abre a imagem respeitando a orientação, mostra um recorte redondo com **zoom** e **mover na horizontal e na vertical** (controles com nome, que funcionam por teclado) e **desenha um quadrado de 256 × 256 pixels**.
3. Exporta em **WebP**, baixando a qualidade até ficar **abaixo de 40 KB** (JPEG se o navegador não souber WebP). A tela mostra o resultado: "Pronta: 256 × 256 px, WebP, 33 KB (original: 1,4 MB)".
4. Só então a imagem é enviada. O **servidor recodifica de novo** (sharp), confere o tamanho e guarda no banco.
5. Ao redesenhar a imagem em um `<canvas>`, os metadados escondidos na foto (como a localização) já são apagados; o servidor apaga de novo, por garantia.
- Onde fica: tabela `profile_photos` (uma linha por pessoa, imagem de até 64 KB), separada de `profiles` para que abrir o perfil não carregue imagens à toa.
- Como é entregue: `GET /api/avatar/<código>`, com o código aleatório da tabela. A resposta tem `Content-Type: image/webp` fixo, `X-Content-Type-Options: nosniff`, `Content-Security-Policy: default-src 'none'` e `ETag`. **Só quem está logado recebe a imagem**; visitantes veem as iniciais. Assim a foto de alguém não vira imagem pública na internet.
- Nenhuma imagem de fora entra no site: nada de buscar foto do GitHub por endereço, e a política de conteúdo do site aceita imagens só do próprio domínio.
- Limites: 5 trocas de foto por hora por pessoa.
- Moderação: qualquer pessoa pode denunciar uma foto; contribuidor e admin podem **remover a foto** (volta às iniciais), e a ação fica no registro. Banir remove a foto.

**Links do perfil** (aparecem como **selos** no cartão do topo):
- Serviços: **GitHub, X, LinkedIn, Instagram, YouTube, e-mail e site pessoal**. Um de cada, todos opcionais.
- Para os cinco serviços conhecidos a pessoa digita **só o apelido** (o site mostra o começo do endereço fixo ao lado: `github.com/`, `x.com/`, `linkedin.com/in/`, `instagram.com/`, `youtube.com/@`). O servidor confere o formato de cada serviço e **monta o endereço**. Ninguém consegue guardar um endereço qualquer no lugar de um perfil do GitHub, o que impede golpes de disfarce.
- **Site pessoal:** endereço `https` completo, até 200 caracteres, só caracteres ASCII visíveis (endereços com acento usam a forma `xn--`), sem usuário e senha na frente, sem `localhost` nem número de IP.
- **E-mail:** é um e-mail **de contato escolhido pela pessoa**, que não precisa ser o do login. Fica escondido atrás do botão do selo ("E-mail · mostrar"), só é entregue a quem está logado e nunca vira um link `mailto:` na página, para dificultar coleta por robôs.
- Todo link externo abre em outra aba com `rel="me nofollow ugc noopener noreferrer"`.
- Os selos mostram "informado pela pessoa": **o site não verifica** que o perfil é realmente dela.
- Onde aparecem: no cartão do topo do próprio perfil, sempre; no perfil público, se a pessoa o liberar. **Não aparecem** ao lado dos comentários, para a conversa continuar leve.
- Na tela de edição, cada campo mostra o erro na hora e uma **prévia dos selos** atualiza enquanto a pessoa digita.

**Privacidade, por padrão o mais fechado:**
- Perfil **privado**. Quem quiser mostrar bio e links liga "Perfil público"; mesmo assim ele nunca mostra anotações nem progresso detalhado.
- Fora dos rankings, a menos que a pessoa entre (`show_in_rankings`).
- Nas conversas aparece só a **foto** (para quem está logado), o **nome de exibição**, o **apelido** e o **badge**. O e-mail de login nunca aparece.
- Apelido: 3 a 24 letras minúsculas, números, `_` e `-`; palavras reservadas (`admin`, `poppy`, `moderador`…) e nomes ofensivos são recusados.

**Rotas novas:**

| Rota | O que faz |
|---|---|
| `GET/PUT /api/profile` | Ler e salvar nome, apelido, bio e opções de privacidade |
| `PUT /api/profile/photo`, `DELETE /api/profile/photo` | Enviar (imagem já compactada) e remover a foto |
| `GET /api/avatar/:codigo` | Entregar a foto, só para quem está logado |
| `PUT /api/profile/links/:servico`, `DELETE ...` | Salvar e remover um link |
| `GET /api/u/:apelido` | O perfil público, se a pessoa o liberou |

---

## 3. Papéis, badges e permissões

| Papel (`role`) | Badge mostrado | Quem é |
|---|---|---|
| `student` | **Aluno** / *Student* | Todo mundo que cria conta (padrão). |
| `contributor` | **Contribuidor** / *Contributor* | Pessoas da equipe e da comunidade que moderam e respondem. |
| `admin` | **Contribuidor** / *Contributor* | Quem cuida da moderação e dos papéis. Mostra o mesmo badge; a diferença é só de permissão. |

O badge sempre sai do papel guardado no servidor. Ele não é um texto que a pessoa possa escolher, e sempre tem o **texto** ao lado da cor (nunca só cor).

**Matriz de permissões** (a base dos testes automáticos):

| Ação | Visitante | Aluno | Contribuidor | Admin |
|---|:---:|:---:|:---:|:---:|
| Ler comentários | ✓ | ✓ | ✓ | ✓ |
| Comentar, responder, reagir | | ✓ | ✓ | ✓ |
| Editar e apagar o **próprio** comentário | | ✓ | ✓ | ✓ |
| Denunciar um comentário ou uma foto | | ✓ | ✓ | ✓ |
| Anotações, foto, links e perfil (só os **próprios**) | | ✓ | ✓ | ✓ |
| Ocultar e restaurar comentário, com motivo | | | ✓ | ✓ |
| Fixar comentário e marcar **resposta oficial** | | | ✓ | ✓ |
| Ver e resolver a fila de denúncias | | | ✓ | ✓ |
| Silenciar uma pessoa por um tempo | | | ✓ | ✓ |
| Remover a foto de outra pessoa | | | ✓ | ✓ |
| Banir | | | | ✓ |
| Mudar papéis | | | | ✓ |
| Apagar definitivamente e ver o registro de moderação | | | | ✓ |
| Ler as anotações de outra pessoa | | | | **ninguém** |

**Como os papéis são dados:**
- Só o admin muda papéis, e cada mudança vai para o registro de moderação.
- O primeiro admin é criado por um comando rodado por você (`pnpm admin:grant e-mail`), com o token de produção que só você tem. Nada de "quem se cadastrar com este e-mail vira admin" no código.
- O papel é lido do banco **a cada requisição**, não de um texto dentro do cookie. Rebaixar alguém vale na hora.
- Contribuidor e admin usam **verificação em duas etapas** (plugin de dois fatores do Better Auth). Ações de admin pedem login recente.
- A função de "se passar por outro usuário" do plugin `admin` fica **desligada**: não precisamos dela e ela é um risco de privacidade.

---

## 4. Painel de anotações

**Onde:** uma gaveta lateral em cada lição ("Minhas anotações", com botão e atalho de teclado) e uma página no perfil com todas as anotações, com busca e filtro por trilha e lição.

**Como funciona:**
- Cada anotação pode ficar ligada a uma **lição** e, se quiser, a um **exercício**. O link vem do próprio lugar onde a pessoa estava. Também existem anotações livres, sem lição.
- **Editor:** barra com negrito, itálico, título, listas, código, bloco de código, citação e link. Cada botão tem nome e atalho. O botão **Modo Markdown** troca para o texto puro. Uma anotação guarda **Markdown**, nunca HTML.
- **Salva sozinho** poucos segundos depois de parar de digitar, com o aviso "Salvo às 14:32". Sem conexão, o rascunho fica no navegador e sobe quando voltar.
- **Conflito entre dois aparelhos:** cada anotação tem um número de versão. Se outra aba salvou antes, o site avisa "Esta anotação mudou em outro aparelho" e oferece juntar, em vez de sobrescrever em silêncio.
- **Limites:** 50 KB por anotação e 500 por pessoa.
- **Privada de verdade:** só a dona lê. Nem admin nem contribuidor veem anotações pelo site.

**Baixar em Markdown:**
- Uma anotação vira um arquivo `.md`. Todas viram um único `.md` agrupado por trilha e lição, ou um `.zip` com um arquivo por anotação.
- Cada arquivo começa com um cabeçalho que liga a anotação à origem:

```markdown
---
titulo: "Dúvida sobre o comando run"
licao: "Seu primeiro programa"
link: "https://poppy.lat/aprender/pensar-em-codigo/primeiro-programa/ola"
exercicio: null
criada: 2026-09-30
atualizada: 2026-10-02
---

O `run` compila e roda em um passo...
```

- Os valores do cabeçalho são sempre escritos entre aspas e escapados (uma quebra de linha no título não pode inventar um campo). O nome do arquivo é limpo: só letras, números e `-`, sem barras.
- O pedido "baixar os comentários" foi entendido como **baixar as anotações**. Os comentários que a pessoa escreveu no fórum e nas lições entram no "baixar todos os meus dados".

---

## 5. Comentários no fim de cada lição

**Como é:**
- Uma seção "Conversa desta lição" depois do "Marcar como concluída". Carrega **sob demanda** (quando a pessoa chega perto dela), então a página estática continua rápida e funciona sem a conversa.
- **Dois níveis:** comentário e respostas. Respostas a respostas ficam no mesmo nível, com "@nome". Aninhar mais dificulta a leitura, principalmente para quem tem TDAH e para leitores de tela.
- **Ordem:** primeiro os fixados e as **respostas oficiais**, depois os mais recentes (com botão para os mais antigos). Páginas de 20, com "Ver mais".
- **Escrever:** caixa de texto com uma barra pequena (negrito, itálico, código, lista, link), **seletor de emoji**, pré-visualização e limite de 2.000 caracteres. Sem títulos, sem imagens.
- **Reações:** 👍 ❤️ 🎉 💡 🤔 😅, uma de cada por pessoa. Cada botão tem nome falado ("Reagir com lâmpada").
- **Editar:** o comentário mostra "editado". **Apagar:** vira "Comentário removido pela autora ou autor" se tiver respostas, e some se não tiver.
- **Denunciar:** motivo (spam, ofensivo, fora do tema, dados pessoais, outro) e um texto opcional.
- **Contribuidores e admins:** ocultar com motivo (fica "Ocultado pela moderação: motivo", visível como aviso), restaurar, fixar, marcar resposta oficial (mostra selo **Resposta oficial**), silenciar.
- **Quem escreve o quê fica claro:** cada mensagem mostra nome, `@apelido` e badge com texto.

**Regras do dia a dia:**
- Ler é livre; escrever exige conta.
- Conta nova (primeiras 3 mensagens): **sem links**, e com limite de velocidade. Não há pré-moderação, para não travar quem chega.
- Limites: 5 comentários por minuto e 30 por hora por pessoa. Texto repetido é recusado.
- Uma denúncia vai para a fila. **Três denúncias de pessoas diferentes** sobem a prioridade na fila, mas **não ocultam sozinhas**, para não virar arma contra alguém.
- Uma página **Regras da comunidade** (curta, em linguagem simples) fica ligada de cada caixa de comentário. Sem ela a moderação não tem base. Sugestão de tópicos: respeito, nada de dados pessoais, dúvida boa tem o código e o erro, não damos a resposta pronta de exercícios, como denunciar.

**Acessibilidade da conversa:** região com título próprio, foco vai para o comentário recém-criado, formulário de resposta abre no lugar, atualizações avisadas em `aria-live` educado, tudo por teclado, sem animação obrigatória, botão para recolher respostas.

---

## 6. Esquema das novas tabelas

Uma tabela `comments` serve a **lição, o exercício e o tópico do fórum**: o campo `target_type` diz onde o comentário está. Assim a conversa é construída uma vez só e o fórum reaproveita tudo.

```sql
-- 002-comunidade.sql
CREATE TABLE profiles (
  user_id           TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
  handle            TEXT NOT NULL UNIQUE COLLATE NOCASE
                    CHECK (length(handle) BETWEEN 3 AND 24 AND handle NOT GLOB '*[^a-z0-9_-]*'),
  bio               TEXT NOT NULL DEFAULT '' CHECK (length(bio) <= 280),
  is_public         INTEGER NOT NULL DEFAULT 0 CHECK (is_public IN (0, 1)),
  show_in_rankings  INTEGER NOT NULL DEFAULT 0 CHECK (show_in_rankings IN (0, 1)),
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE notes (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  lesson_id    TEXT,
  exercise_id  TEXT,
  title        TEXT NOT NULL DEFAULT '' CHECK (length(title) <= 120),
  body_md      TEXT NOT NULL CHECK (length(body_md) <= 50000),
  version      INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX notes_by_user ON notes (user_id, updated_at DESC);
CREATE INDEX notes_by_lesson ON notes (user_id, lesson_id);

CREATE TABLE comments (
  id            TEXT PRIMARY KEY,
  target_type   TEXT NOT NULL CHECK (target_type IN ('lesson', 'exercise', 'topic')),
  target_id     TEXT NOT NULL,
  parent_id     TEXT REFERENCES comments(id) ON DELETE CASCADE,
  author_id     TEXT REFERENCES user(id) ON DELETE SET NULL,  -- NULL = conta removida
  body_md       TEXT NOT NULL CHECK (length(body_md) BETWEEN 1 AND 2000),
  status        TEXT NOT NULL DEFAULT 'visible'
                CHECK (status IN ('visible', 'hidden_by_moderator', 'deleted_by_author')),
  hidden_reason TEXT,
  is_pinned     INTEGER NOT NULL DEFAULT 0 CHECK (is_pinned IN (0, 1)),
  is_official   INTEGER NOT NULL DEFAULT 0 CHECK (is_official IN (0, 1)),
  edited_at     TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX comments_by_target ON comments (target_type, target_id, created_at);
CREATE INDEX comments_by_parent ON comments (parent_id);
CREATE INDEX comments_by_author ON comments (author_id, created_at DESC);

CREATE TABLE comment_reactions (
  comment_id  TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  emoji       TEXT NOT NULL CHECK (emoji IN ('👍', '❤️', '🎉', '💡', '🤔', '😅')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (comment_id, user_id, emoji)
);

CREATE TABLE reports (
  id           TEXT PRIMARY KEY,
  comment_id   TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  reporter_id  TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  reason       TEXT NOT NULL CHECK (reason IN ('spam', 'ofensivo', 'fora-do-tema', 'dados-pessoais', 'outro')),
  details      TEXT NOT NULL DEFAULT '' CHECK (length(details) <= 500),
  status       TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (comment_id, reporter_id)
);
CREATE INDEX reports_open ON reports (status, created_at);

-- Registro de moderação: só se acrescenta, nunca se altera nem se apaga.
CREATE TABLE moderation_log (
  id          INTEGER PRIMARY KEY,
  actor_id    TEXT NOT NULL,
  action      TEXT NOT NULL,   -- hide, restore, pin, official, mute, ban, role_change, delete
  target_type TEXT NOT NULL,
  target_id   TEXT NOT NULL,
  reason      TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TRIGGER moderation_log_no_update BEFORE UPDATE ON moderation_log
BEGIN SELECT RAISE(ABORT, 'moderation_log é somente de acréscimo'); END;
CREATE TRIGGER moderation_log_no_delete BEFORE DELETE ON moderation_log
BEGIN SELECT RAISE(ABORT, 'moderation_log é somente de acréscimo'); END;

-- Foto do perfil: o servidor guarda sempre uma imagem 256 x 256 em WebP, já recodificada.
CREATE TABLE profile_photos (
  user_id     TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
  photo_key   TEXT NOT NULL UNIQUE,   -- código aleatório usado no endereço da foto
  mime        TEXT NOT NULL DEFAULT 'image/webp' CHECK (mime = 'image/webp'),
  bytes       BLOB NOT NULL CHECK (length(bytes) BETWEEN 100 AND 65536),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Links do perfil: no máximo um por serviço. O valor é só o apelido do serviço (ou o https do site).
CREATE TABLE profile_links (
  user_id     TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  service     TEXT NOT NULL CHECK (service IN ('github', 'x', 'linkedin', 'instagram', 'youtube', 'email', 'site')),
  value       TEXT NOT NULL CHECK (length(value) BETWEEN 1 AND 200 AND value NOT GLOB '*[^!-~]*'),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, service)
);
```

Já pensado para as próximas fases, **ainda não criado**. Está aqui só para provar que o desenho comporta:

```sql
-- Já pensado, ainda NÃO criado:
CREATE TABLE activity_events (
  id INTEGER PRIMARY KEY, user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, ref TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE badge_awards (
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE, badge_id TEXT NOT NULL,
  awarded_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (user_id, badge_id));
CREATE TABLE forum_categories (
  slug TEXT PRIMARY KEY, sort INTEGER NOT NULL DEFAULT 0,
  min_role_to_post TEXT NOT NULL DEFAULT 'student' CHECK (min_role_to_post IN ('student','contributor','admin')),
  is_locked INTEGER NOT NULL DEFAULT 0);
CREATE TABLE forum_topics (
  id TEXT PRIMARY KEY, category_slug TEXT NOT NULL REFERENCES forum_categories(slug),
  author_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 5 AND 120), body_md TEXT NOT NULL CHECK (length(body_md) <= 5000),
  is_pinned INTEGER NOT NULL DEFAULT 0, is_locked INTEGER NOT NULL DEFAULT 0,
  last_activity_at TEXT NOT NULL DEFAULT (datetime('now')), created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE INDEX topics_by_category ON forum_topics (category_slug, is_pinned DESC, last_activity_at DESC);
```

Testei tudo num SQLite de teste com chaves estrangeiras ligadas: apelido com espaço, comentário vazio, tipo de destino inválido e emoji fora da lista são recusados, o registro de moderação recusa `UPDATE` e `DELETE`, e a tabela de fotos recusa imagem acima de 64 KB, formato que não seja WebP e uma segunda foto para a mesma pessoa. A tabela de links recusa serviço fora da lista, dois links do mesmo serviço, espaço, quebra de linha e caracteres fora do ASCII.

**Ao apagar a conta:** anotações, perfil, foto, links, reações, denúncias e progresso somem. Os comentários com respostas **ficam**, com `author_id` vazio e o texto trocado por "[removido]", para não quebrar a conversa dos outros. O registro de moderação guarda só identificadores, sem texto do usuário.

---

## 7. Preparado para o futuro

**Porcentagem de conclusão por trilha.** Não se guarda: calcula-se a cada leitura, com `lesson_progress` dividido pelo total de lições do catálogo. Para isso o build gera um `catalog.json` a partir do catálogo do site, que a API usa também para conferir `lesson_id` e `exercise_id`.

**Badges com jogo.**
- As **definições** dos badges ficam no repositório (arquivo versionado, revisado em PR). O banco guarda só **quem ganhou o quê e quando** (`badge_awards`).
- Quem dá o badge é o **servidor**, a partir de eventos gravados por ele (`activity_events`: lição concluída, exercício resolvido, resposta marcada como oficial). O navegador nunca diz "ganhei".
- Não confundir com o **badge de papel** (Aluno, Contribuidor): esse vem do papel, aquele vem de conquistas.
- Princípios para quem é neurodivergente: nada de sequência diária que se perde, nada de contagem regressiva, nada de comparação por velocidade. Badges celebram **terminar, tentar de novo, perguntar e ajudar**. O texto do badge diz o que foi feito.

**Ranking.**
- **Opt-in** (`show_in_rankings`, desligado por padrão) e a pessoa sai quando quiser.
- Pontos vêm de um livro-razão de acréscimo, e o ranking é calculado dele. Pontuam lições concluídas, exercícios resolvidos e **reações de pessoas diferentes** em respostas úteis. **Não** pontua a quantidade de comentários (isso estimula spam).
- Rankings por semana e por trilha, para que quem chegou agora tenha chance.

**Micro fórum por categorias.**
- `forum_categories` com um papel mínimo para postar (a categoria de avisos só aceita contribuidores).
- Cada tópico é uma linha em `forum_topics`; as respostas são `comments` com `target_type = 'topic'`. Moderação, reações, denúncias e o registro são os mesmos da lição.
- Categorias sugeridas: **Avisos** (só equipe), **Dúvidas sobre Ori**, **Dúvidas sobre Aipo**, **Programação para quem está começando**, **Mostre o seu projeto**, **Estudar com TDAH, dislexia e outras formas de pensar**, **Sugestões para o curso**, **Conversa livre**.
- Busca: SQLite tem busca de texto (FTS5); confirmar o suporte no Turso na hora.

---

## 8. Segurança específica desta parte

Vale tudo o que está na seção "Segurança dos dados" do plano. Além disso:

**Texto de usuário (XSS).**
- Só se guarda Markdown. Ao mostrar: `markdown-it` com `html: false` e depois DOMPurify. Links só `http`, `https` e `mailto`, com `rel="nofollow ugc noopener noreferrer"`. Sem imagens em comentários (também evita rastreio).
- Antes de gravar: normalizar em Unicode (NFC) e recusar caracteres de controle e de direção de texto invisíveis, que servem para disfarçar nomes e mensagens.
- **Content-Security-Policy** nas páginas do Aprender, começando em modo `Report-Only`. O site tem um script pequeno no `<head>`, então a política usa o hash dele, sem `unsafe-inline`.

**Autorização.**
- Uma única função `can(usuario, ação, recurso)` decide tudo, com **negar por padrão**. Toda rota chama essa função.
- A matriz da seção 3 vira uma tabela de testes: para cada papel e ação, o resultado esperado. Também há testes que tentam ler ou mudar dados de outra pessoa e precisam falhar (IDOR).
- Rotas que mudam dados conferem `Origin` (além do `SameSite=Lax`) e usam a proteção de CSRF do Better Auth.

**Moderação.**
- O registro de moderação só recebe acréscimos (o banco recusa `UPDATE` e `DELETE`).
- Cada ação de moderação grava quem fez, o quê e por quê. Ocultar sempre pede um motivo.
- Admins e contribuidores com 2FA e login recente para banir e mudar papel.

**Crianças e adolescentes.** A LGPD (art. 14) pede cuidado extra com dados de crianças e adolescentes. **Antes de abrir cadastros**, é preciso decidir a idade mínima, o que pedir a quem é menor e o texto da política de privacidade, com **revisão jurídica**. Enquanto isso, o desenho já ajuda: perfil privado, e-mail de login nunca à vista, foto visível só para quem está logado, sem mensagens privadas.

**Foto e links do perfil.**
- Envio da foto: só `PUT` com o corpo da imagem, tipos `image/webp`, `image/jpeg` ou `image/png`, no máximo 200 KB de entrada (o navegador já mandou menos de 40 KB; qualquer coisa maior é recusada). O servidor confere os primeiros bytes do arquivo (não confia no tipo declarado), limita o número de pixels antes de decodificar (contra imagens feitas para estourar a memória), recusa imagem animada e **recodifica sempre** para WebP 256 × 256. O que é gravado é o resultado do servidor, nunca o arquivo enviado.
- Entrega: tipo fixo, `nosniff` e política `default-src 'none'`, para que a resposta nunca seja tratada como página. O endereço usa um código aleatório, não o número do usuário.
- Nada de imagem de outro domínio no site (`img-src 'self'`), o que também evita que alguém use uma foto hospedada fora para rastrear quem abre o perfil.
- Links: o servidor guarda só o apelido do serviço ou o `https` do site, valida cada um com a regra do seu serviço e monta o endereço. Sem `javascript:`, `data:` ou `http`. Todos abrem com `rel="me nofollow ugc noopener noreferrer"`.
- E-mail de contato: entregue só a quem está logado, sem `mailto:` no HTML e com limite de requisições, contra coleta em massa.
- O apelido e o nome de exibição passam pela mesma limpeza de Unicode dos comentários.

**Sem mensagens privadas** (nem agora nem no fórum): elas são o maior risco para menores e o maior custo de moderação.

**Agentes.** O que um agente lê de comentários e anotações é dado, nunca instrução (regra da seção "Agentes e o Turso MCP" do plano).

**Dependências.** Poucas, fixadas no `pnpm-lock.yaml`, com `pnpm audit` na integração contínua e Dependabot ligado.

---

## 9. Ordem de construção

Substitui a fase 6 do plano:

| Fase | O que entra | Por quê nesta ordem |
|---|---|---|
| 6a | Conta (Better Auth), perfil privado, progresso sincronizado, banco de desenvolvimento e migrações | Base de tudo. |
| 6b | **Anotações** e download em Markdown | Só a própria pessoa lê: risco baixo e valor alto. |
| 6c | **Comentários + moderação + regras da comunidade**, todos juntos | Nunca abrir conversa sem a ferramenta de ocultar e o registro no mesmo dia. |
| 6d | Playground de Aipo e exercícios | Já descritos no plano. |
| 6e | Porcentagem por trilha na tela, badges e ranking opcional | Precisa de eventos gravados desde 6a. |
| 6f | Micro fórum | Reaproveita comentários e moderação. |

---

## 10. Decisões que assumi (diga se quiser outra)

1. **Admin mostra o badge Contribuidor.** Assim ficam só os dois badges que você pediu.
2. **Perfil privado por padrão**, público só por escolha.
3. **Ler comentários é livre; escrever exige conta.**
4. **Sem mensagens privadas.** Foto de perfil **sim**, compactada no navegador e recodificada no servidor, e visível só para quem está logado.
5. **Links sociais:** os sete serviços pedidos; e-mail de contato escondido atrás de um clique e só para quem está logado.
6. **"Baixar os comentários" = baixar as anotações**, com o link da lição em cada uma.
7. **Idade mínima e política de privacidade:** ficam para decidir com revisão jurídica antes de abrir cadastros.
