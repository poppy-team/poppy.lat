# Aprender no poppy.lat: plano

Data: 2026-09-30. Autor: Claude, a pedido de Raillen. A área se chama **Aprender** (`/aprender`, em inglês `/en/learn`); cada curso dentro dela mantém o seu nome.

> **Em uma frase:** uma escola dentro do site, com um curso comum que serve para Ori e Aipo ao mesmo tempo, e depois uma trilha para cada linguagem, do uso até a implementação. Tudo guiado por projetos e escrito para quem tem TDAH, dislexia, outras neurodivergências ou nunca programou.

Inspiração de estrutura: a área de curso do orilang.vercel.app (curso por módulos, receitas curtas, projetos guiados, livro de "construa uma linguagem"). O conteúdo de lá não tem licença declarada, então **nada é copiado**: só a ideia de organização. Tudo aqui é escrito do zero.

---

## 1. Mapa dos cursos

```
/aprender
├── 0. Começo aqui (para quem nunca programou)
├── 1. Curso comum: Pensar em código        ← serve para Ori e Aipo
├── 2. Curso comum: Como uma linguagem funciona ← serve para Ori e Aipo
├── 3. Trilha Ori
│   ├── 3a. Usar Ori
│   └── 3b. Por dentro da Ori (implementação)
└── 4. Trilha Aipo
    ├── 4a. Usar Aipo
    └── 4b. Por dentro da Aipo (implementação)
```

**Como o curso comum serve para as duas linguagens:** cada exemplo aparece em duas abas, **Ori** e **Aipo**. A pessoa escolhe uma vez e o site lembra a escolha em todas as lições. O texto explica o conceito (o que é uma variável, uma função, um erro); só o código muda de aba. Quando as linguagens pensam diferente (Ori tem tipos explícitos e compila para nativo; Aipo é dinâmica e tem contratos), a lição tem uma caixa **"Onde elas diferem"**, curta, que vira uma ponte para as trilhas específicas.

**Ordem sugerida, não obrigatória.** A landing mostra três portas de entrada:
- "Nunca programei" → 0 → 1 → trilha de uso.
- "Já programo e quero usar Ori ou Aipo" → 1 (rápido) → 3a ou 4a.
- "Quero entender como se cria uma linguagem" → 2 → 3b ou 4b.

---

## 2. Currículo guiado por projetos

Cada módulo constrói **um projeto pequeno e real**. Cada lição acrescenta uma peça a ele. Ao fim do módulo, a pessoa tem algo que roda.

### 0. Começo aqui (4 lições, sem código de linguagem ainda)
Projeto: **preparar a sua mesa de trabalho.**
1. O que é um programa (e o que é uma linguagem de programação)
2. O terminal sem medo: abrir, `cd`, `ls`, rodar um comando
3. Um editor de código: abrir uma pasta, salvar, ver erros
4. Como ler uma mensagem de erro (ela é uma pista, não uma bronca)

### 1. Curso comum: Pensar em código (8 módulos)
| Módulo | Projeto | Conceitos |
|---|---|---|
| 1. Primeiro programa | **Cartão de apresentação** no terminal | arquivo, rodar, imprimir texto, comentários |
| 2. Valores e nomes | **Calculadora de gorjeta** | números, texto, variáveis, constantes, interpolação |
| 3. Decisões | **Classificador de senhas** (fraca, média, forte) | `if`, comparações, lógica |
| 4. Repetição | **Tabuada e contador de palavras** | laços, listas |
| 5. Funções | **Conversor de unidades** | funções, parâmetros, retorno |
| 6. Dados com forma | **Agenda de contatos** | structs, campos, métodos |
| 7. Quando algo dá errado | **Leitor de arquivo de notas** | erros, valores ausentes, mensagens úteis |
| 8. Organizar e testar | **Lista de tarefas** (projeto final) | módulos, testes, pacote local |

### 2. Curso comum: Como uma linguagem funciona (6 módulos)
Projeto único do começo ao fim: **Conta, uma linguagem de calculadora** que entende `2 + 3 * (4 - 1)` e depois variáveis. Construída em passos, com o código de exemplo nas duas linguagens.
1. Do texto aos pedaços: **lexer** (tokens)
2. Dos pedaços à árvore: **parser** (AST)
3. Dar sentido à árvore: **interpretador**
4. Pegar erros antes de rodar: **verificação** (nomes, tipos)
5. Transformar em instruções: **bytecode e máquina virtual**
6. Mensagens de erro que ajudam: **diagnósticos**

Aqui o curso comum encontra as trilhas: cada capítulo termina mostrando **onde aquela peça mora no código real** da Ori (crates `ori-*`) e da Aipo (crates `aipo-*`), com links para a revisão fixada, como a documentação já faz.

### 3a / 4a. Trilhas de uso
Projetos maiores, cada um em 4 a 8 lições:
- **Ori:** ferramenta de linha de comando (CLI de notas), analisador de logs, pequeno servidor, jogo de terminal, interop com C.
- **Aipo:** modelo com invariantes (conta bancária, estoque), app web com `aipo-html`/`aipo-http`, jogo com `aipo-game`, interface com `aipo-ui`, programa que roda no navegador pelo backend JavaScript.
- Receitas curtas (5 minutos, um problema, uma solução) ao lado de cada trilha, como um livro de cozinha.

### 3b / 4b. Trilhas de implementação
Leitura guiada do compilador real, módulo por módulo, com um exercício de contribuição em cada um ("adicione um aviso novo", "crie uma função na stdlib").
- **Ori:** pipeline do `ori` (lexer → parser → checagem de tipos → IR → AOT e JIT), runtime, stdlib, LSP, bootstrapping.
- **Aipo:** lexer, HIR, VM de bytecode em Rust, backend JavaScript, Wasm JIT, contratos e invariantes em tempo de execução, formatter.

Essas trilhas dependem do conteúdo técnico dos repositórios; a documentação de desenvolvimento que já importamos serve de referência.

---

## 3. Anatomia de uma lição

Todas as lições têm a **mesma forma**. Previsibilidade reduz esforço para todo mundo, e muito mais para quem tem TDAH ou é autista.

1. **Cabeçalho fixo:** curso › módulo, "Lição 2 de 5", tempo estimado (5 a 12 minutos), nível.
2. **Nesta lição você vai:** 1 a 3 objetivos, em frases curtas.
3. **O que você vai construir:** uma frase e, quando der, o resultado esperado no terminal.
4. **Passos numerados:** cada passo faz uma coisa só. Um bloco de código por passo, no máximo 10 linhas.
5. **Checkpoint:** "Se você viu isto, deu certo." Com a saída exata.
6. **Se travar:** os 2 ou 3 erros mais comuns daquele passo e como sair deles.
7. **Resumo:** 3 frases no máximo.
8. **Palavras novas:** glossário da lição.
9. **Próximo passo:** um link, uma frase.

### A casca visual da lição

A lição **não usa** o chrome da documentação (navbar, barra lateral, "nesta página"). Quem estuda precisa saber, só de olhar, que está numa aula e não numa página de referência. Por isso:

- **Barra própria, verde e calma:** botão "Conteúdo", marca, curso › módulo, "Modo foco", "Leitura" e conta. O resto do site fica dentro do painel de conteúdo.
- **Painel de conteúdo:** todos os cursos, módulos e lições, com ✓ nas concluídas, a atual marcada e "em breve" nas que ainda não existem. Abre com foco preso e fecha com Escape.
- **Folha única:** uma coluna centrada, sobre fundo levemente esverdeado, com filete verde no topo. Acima do título: "Lição N de M · curso" e um marcador com um traço por lição do módulo (feita, atual, em breve).
- **Fim da lição:** marcar como concluída, lição anterior e próxima, feedback e conversa.
- **Espaço para vídeo:** `.lesson-media` ocupa a largura do texto (16:9) e `.lesson-media--wide` passa um pouco dela. Nada carrega de terceiros sozinho: incorporar um vídeo é decisão de quem escreve a lição e exige liberar o provedor na Content-Security-Policy (`frame-src`), com revisão de segurança. Preferir `youtube-nocookie.com` e mostrar sempre a transcrição ao lado.

Regras de escrita:
- Um conceito novo por lição. Se precisar de dois, vira duas lições.
- Frases curtas, voz ativa, português do dia a dia. Termo técnico sempre explicado na primeira vez.
- Proibido "simplesmente", "é só", "óbvio", "trivial". O que é fácil para quem escreve não é para quem lê.
- Linguagem literal. Metáfora só se vier explicada logo depois.
- Cada símbolo novo do código é explicado (`--`, `#`, `end`, `{ }`, `f"..."`).

---

## 4. Acessibilidade

A página inteira segue WCAG 2.2 AA. Além disso, decisões específicas por público:

### TDAH
- Lições curtas (até 12 minutos) com objetivo visível no topo.
- **Barra de progresso** do módulo e marcação de lição concluída (salvo no navegador agora; na conta, no futuro).
- **Modo foco:** esconde cabeçalho, barra lateral e sumário; sobra só a lição.
- "Continue de onde parou" na landing.
- Checkpoints frequentes dão pequenas vitórias e mostram que está funcionando.
- Nada se move sozinho: sem carrosséis, sem animações automáticas.

### Dislexia
- Texto alinhado à esquerda, nunca justificado. Linha de 60 a 70 caracteres. Entrelinha de 1,6 ou mais.
- **Preferências de leitura:** tamanho do texto, espaçamento entre letras e linhas, e troca da fonte do texto por uma fonte de alta legibilidade (Atkinson Hyperlegible). A pesquisa mostra que espaçamento e tamanho ajudam mais do que fontes "para dislexia", então o espaçamento é a opção principal.
- Itálico só em trechos curtos; ênfase com negrito.
- Código em fonte monoespaçada com caracteres bem distintos (`0 O`, `1 l I`).

### Autismo e outras neurodivergências
- Estrutura idêntica em todas as lições (seção 3).
- Instruções literais e completas: nada fica implícito ("abra o terminal na pasta do projeto", não "vá para o projeto").
- Tempo estimado honesto e sem pressão: não há prazos, pontos ou rankings.

### Quem nunca programou
- Porta "Começo aqui" (curso 0).
- Glossário do curso, com cada termo linkado na primeira vez que aparece na lição.
- "Por que isso importa" em uma frase antes de cada conceito.
- Saída esperada sempre mostrada.

### Para todos
- Respeita `prefers-reduced-motion`, tema claro e escuro, zoom de 200% sem quebrar a página.
- Navegação completa por teclado; foco visível.
- Blocos de código com nome da linguagem para leitores de tela; imagens e diagramas com texto alternativo e, quando forem complexos, com descrição em texto logo abaixo.
- Contraste mínimo 4.5:1 (7:1 no texto das lições).

---

## 5. Como o conteúdo é escrito e mantido

- **Markdown no próprio repositório do site**, em `site/aprender/` (PT) e `site/en/learn/` (EN). Diferente da documentação, o curso é conteúdo original do poppy.lat, então não passa pelo importador.
- **Frontmatter de cada lição:** `course`, `module`, `lesson`, `duration`, `level`, `project`, `objectives`, `testedWith` (versão da Ori/Aipo em que o código foi testado).
- **Abas Ori | Aipo** com o `::: code-group` que o VitePress já tem, e a escolha lembrada entre páginas.
- **Caixas padronizadas:** Checkpoint, Se travar, Onde elas diferem, Palavras novas.
- **Idiomas:** PT primeiro. EN entra por módulo completo, nunca meia lição. Uma lição sem tradução mostra um aviso na versão EN apontando para a PT.
- **Sempre aprimorado:** cada lição tem no rodapé "Esta lição te ajudou?" e "Algo confuso?", que abre uma issue no GitHub já com o nome da lição. Um arquivo `CHANGELOG` do curso registra o que mudou.
- **Código que não apodrece (fase 3):** um script extrai os blocos de código das lições e roda com `ori run` e `aipo run` na CI, comparando com a saída do Checkpoint. Assim, quando a linguagem muda, a lição quebrada aparece antes de chegar a quem estuda.

---

## 6. Futuro: conta, playground e exercícios

Nada disso entra agora. O esqueleto já nasce preparado: progresso e preferências passam por um único módulo (`course-state.ts`), que hoje salva no navegador e depois passa a falar com a API.

### Decisão tomada: SQLite com Turso

O banco é **SQLite**, hospedado no **Turso** (libSQL, compatível com SQLite). Motivos: é o mesmo SQL no computador de quem desenvolve (um arquivo `.db`) e em produção, é barato para o volume de um curso e o esquema cabe em poucos arquivos `.sql` versionados no repositório.

**O que vai para o banco:** só dados de cada pessoa (conta, progresso, preferências, tentativas de exercícios, código salvo no playground).
**O que não vai:** o conteúdo do curso. Lições, enunciados e testes dos exercícios continuam em Markdown e arquivos no repositório, revisados por PR. O banco guarda apenas o identificador de cada um (por exemplo `pensar-em-codigo/primeiro-programa/ola`).

### Como o site estático conversa com o Turso

```
navegador (páginas VitePress estáticas)
   │  fetch('/api/...')  com cookie de sessão HttpOnly
   ▼
Vercel Functions  (pasta api/ na raiz do repositório)
   │  @libsql/client  com TURSO_DATABASE_URL e TURSO_AUTH_TOKEN
   ▼
Turso (libSQL)
```

- O site continua 100% estático. As funções da pasta `api/` rodam na Vercel no mesmo domínio, então não há CORS nem configuração extra de hospedagem.
- **O token do Turso nunca vai para o navegador.** Ele só existe nas variáveis de ambiente da Vercel. O navegador fala apenas com `/api`.
- Sem login, tudo funciona como hoje (progresso no navegador). Ao entrar, o progresso local é **mesclado** com o da conta (união das lições concluídas; nada se perde) e, dali em diante, cada mudança vai para a API e também fica no navegador, para a página não depender da rede.
- Desenvolvimento local: o mesmo `@libsql/client` aponta para `file:local.db`. As migrações ficam em `db/migrations/NNN-nome.sql` e um script aplica em ordem, local ou no Turso.

### Login

- Entrar com **GitHub** (quem programa já tem) e com **e-mail por link mágico** (para iniciantes, sem senha para lembrar).
- Sessão em cookie `HttpOnly`, `Secure`, `SameSite=Lax`, guardada na tabela `sessions`. Uma biblioteca de autenticação com suporte a SQLite/libSQL faz o fluxo OAuth e o link por e-mail; a escolha exata fica para a implementação.
- Dados mínimos: nome de exibição, e-mail e avatar. A conta pode ser **exportada e apagada** pela própria pessoa (LGPD).

### Esquema inicial

> **Atualização:** as tabelas `users`, `auth_accounts` e `sessions` abaixo serão trocadas pelas que o Better Auth gera (`user`, `session`, `account`, `verification`). As demais continuam e apontam para `user(id)`. O desenho completo da comunidade (perfil, anotações, comentários, papéis, badges, fórum) está em [comunidade.md](aprender-comunidade.md).

```sql
-- 001-inicial.sql
CREATE TABLE users (
  id            TEXT PRIMARY KEY,            -- uuid
  email         TEXT UNIQUE,
  display_name  TEXT NOT NULL,
  avatar_url    TEXT,
  preferences   TEXT NOT NULL DEFAULT '{}',  -- JSON: tamanho, espaçamento, fonte, foco, aba de código
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE auth_accounts (                 -- um usuário pode ter GitHub e e-mail
  provider      TEXT NOT NULL,               -- 'github' | 'email'
  provider_id   TEXT NOT NULL,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (provider, provider_id)
);

CREATE TABLE sessions (
  id            TEXT PRIMARY KEY,            -- valor aleatório; o cookie guarda só o hash
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at    TEXT NOT NULL
);

CREATE TABLE lesson_progress (
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id     TEXT NOT NULL,               -- 'pensar-em-codigo/primeiro-programa/ola'
  status        TEXT NOT NULL CHECK (status IN ('started', 'completed')),
  code_tab      TEXT,                        -- 'Ori' | 'Aipo' usada na lição
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE exercise_attempts (
  id            INTEGER PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id   TEXT NOT NULL,               -- definido no repositório, ao lado da lição
  language      TEXT NOT NULL CHECK (language IN ('ori', 'aipo')),
  code          TEXT NOT NULL,
  passed        INTEGER NOT NULL,            -- 0 ou 1
  hints_used    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX exercise_attempts_by_user ON exercise_attempts (user_id, exercise_id);

CREATE TABLE playground_snippets (           -- código salvo pela pessoa no playground
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  language      TEXT NOT NULL CHECK (language IN ('ori', 'aipo')),
  lesson_id     TEXT,
  code          TEXT NOT NULL,
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### API inicial

| Rota | O que faz |
|---|---|
| `GET /api/me` | Quem está logado (ou 401) e as preferências |
| `GET /api/progress` | Todas as lições da pessoa |
| `PUT /api/progress/:lessonId` | Marca como iniciada ou concluída |
| `POST /api/progress/merge` | Mescla o progresso do navegador ao entrar |
| `PUT /api/preferences` | Salva as preferências de leitura |
| `POST /api/exercises/:id/attempts` | Registra uma tentativa |
| `GET/PUT /api/snippets/:id` | Código salvo no playground |
| `GET /api/account/export`, `DELETE /api/account` | Exportar e apagar a conta |

### Playground e exercícios

- **Aipo** tem backend JavaScript e caminho Wasm, então o código roda **no navegador**. Os testes do exercício também rodam ali, e a API só registra o resultado.
- **Ori** compila para nativo. No navegador precisaria de um alvo Wasm; do contrário, de um servidor com sandbox. Vercel Functions não são lugar para executar código de terceiros, então isso é uma decisão separada, junto com o time da Ori.
- Como o resultado dos exercícios vem do navegador, ele serve para a pessoa acompanhar o próprio avanço, não como nota ou certificado. Não há ranking.
- Exercícios: enunciado, código inicial no playground, testes que dizem o que falta com linguagem gentil, e dicas em camadas (dica 1, dica 2, solução).

### Segurança dos dados

O banco vai guardar dados de pessoas, inclusive crianças e adolescentes que estejam aprendendo. Estas regras valem antes de qualquer tabela ir para produção.

**Dados mínimos e privacidade**
- Guardar só o necessário: e-mail, nome de exibição e avatar. Nenhuma senha (login por GitHub ou link por e-mail).
- Cada pessoa pode exportar e apagar a conta. O `ON DELETE CASCADE` do esquema depende de `PRAGMA foreign_keys = ON` em cada conexão; isso precisa ser ligado e testado, senão a exclusão deixa dados órfãos.
- Política de retenção: tentativas de exercícios e código salvo são apagados junto com a conta; um prazo máximo (por exemplo 12 meses sem uso) é definido antes do lançamento e escrito na página de privacidade (LGPD).

**Acesso ao banco**
- Somente as funções da pasta `api/` falam com o Turso. O token fica só nas variáveis de ambiente da Vercel, nunca no código, no navegador, nos logs nem no repositório.
- Três bancos separados, cada um com o seu token: **desenvolvimento** (arquivo local `local.db`), **preview** (uma cópia sem dados reais) e **produção**. Nenhum PR de preview enxerga a produção.
- Tokens com o menor poder possível e com prazo de validade. O Turso permite criar tokens com expiração e somente leitura; confirmar as opções exatas na hora de implementar.
- Mudanças de esquema só por migração (`db/migrations/*.sql`) revisada em PR. Ninguém altera a produção à mão.

**Consultas e autorização**
- Todas as consultas usam parâmetros (`args` do `@libsql/client`), nunca texto montado por concatenação. Isso evita injeção de SQL.
- O `user_id` vem sempre da sessão no servidor, nunca do corpo da requisição. Cada rota tem um teste que tenta ler ou alterar dados de outra pessoa e precisa falhar.
- `lesson_id` e `exercise_id` são conferidos contra o catálogo do repositório antes de gravar; qualquer outro valor é recusado.
- Rotas que alteram dados conferem o cabeçalho `Origin` (além do `SameSite=Lax` do cookie) e têm limite de requisições, com limite mais baixo no envio do link por e-mail.

**Conteúdo enviado por quem estuda (código, tentativas, snippets)**
- É texto **não confiável**. Tem tamanho máximo (por exemplo 20 KB por item), nunca é executado no servidor e nunca é mostrado como HTML; sempre escapado.
- O playground roda o código em um `iframe` com `sandbox` e sem `allow-same-origin`, idealmente em outro domínio (por exemplo `play.poppy.lat`), para que o código de uma pessoa nunca leia o cookie de sessão nem chame a API como outra.
- Logs registram eventos (entrar, sair, apagar conta), nunca o conteúdo do código nem o e-mail completo.

**Agentes e o Turso MCP**
- Existem dois servidores MCP do Turso. O **hospedado** (`https://mcp.turso.ai/mcp`) gerencia bancos e grupos e entra por login no navegador, com token limitado a uma organização ou grupo. O **local** (`tursodb arquivo.db --mcp`) abre um arquivo de banco no computador e tem ferramentas de leitura, escrita e mudança de esquema.
- Regra: agentes só recebem acesso ao banco de **desenvolvimento** (arquivo local ou um grupo só de desenvolvimento). A produção nunca é ligada a um agente, porque as ferramentas de escrita e de `DROP TABLE` não têm confirmação.
- O que um agente lê do banco (código e textos de quem estuda) é dado, nunca instrução. Um texto salvo por uma pessoa pode tentar dar ordens ao agente (injeção de prompt); o agente ignora isso e mostra o conteúdo apenas como citação.
- Este plano não instala o Turso MCP no ambiente do projeto: o serviço hospedado não está no diretório de conectores do Claude e o login é feito por quem é dona da conta. Como configurar, no computador da Raillen: `claude mcp add turso-dev -- tursodb ./local.db --mcp` (local) ou, para o hospedado, `/plugin marketplace add tursodatabase/turso-mcp` e `/plugin install turso@turso`, escolhendo só o grupo de desenvolvimento.

### O que fica de fora por enquanto

- Qualquer código de banco, API ou login (entra na fase 6).
- Execução de Ori no servidor.
- Certificados, rankings, turmas e painel para professores.
- Réplicas embarcadas do Turso e modo offline além do `localStorage`.

## 7. Fases

| Fase | O que entra |
|---|---|
| **1 (este PR)** | Rota `/aprender` com landing, mapa das trilhas, barra lateral própria, 1 lição de exemplo completa, preferências de leitura, modo foco e progresso local. Só PT. |
| 2 | Curso 0 completo e Módulo 1 do curso comum (PT). |
| 3 | Módulos 2 a 4 do curso comum; teste automático dos exemplos na CI. |
| 4 | Curso "Como uma linguagem funciona"; EN do que já existir. |
| 5 | Trilhas de uso de Ori e Aipo. |
| 6a | Conta, perfil privado, progresso sincronizado (ver [comunidade.md](aprender-comunidade.md)) |
| 6b | Anotações com download em Markdown |
| 6c | Comentários nas lições, com moderação e regras da comunidade, tudo junto |
| 6d | Trilhas de implementação, playground de Aipo no navegador e exercícios |
| 6e | Porcentagem por trilha, badges e ranking opcional |
| 6f | Micro fórum por categorias |

---

## 8. Decisões tomadas

1. **Nome da área:** Aprender.
2. **Revisão do código das lições:** será pedida na conversa do projeto depois de mudanças substanciais nas linguagens (Ori S3, Aipo S2). Cada lição registra em `examplesFrom` a revisão das linguagens em que foi escrita, o que mostra quais lições precisam de nova revisão.
3. **Idiomas:** só português do Brasil por enquanto. `/en/learn` é uma página que explica isso.
4. **Banco:** SQLite no Turso para conta, progresso e exercícios (seção 6).
