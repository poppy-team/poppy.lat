# Painel de gestão do Aprender

Data: 2026-09-30 (versão 3, com as duas rodadas de decisões do Raillen). Complementa o [plano do Aprender](aprender-plano.md), a [biblioteca](aprender-biblioteca.md), a [comunidade](aprender-comunidade.md) e os [recursos de acessibilidade e vídeo](aprender-acessibilidade-e-video.md). É um desenho: **só a fase 1 começou a ser construída (seção 10).**

> **Em uma frase:** um painel só para a equipe, em uma rota própria, para cuidar de **pessoas e conteúdo**: usuários e permissões, aulas (texto, vídeo, áudio, imagens, slides), posts do blog e moderação. Sem configuração do site e sem mexer no visual.

---

## 1. Decisões já tomadas

| # | Decisão | Consequência |
|---|---|---|
| 1 | **As aulas passam a morar no banco** (caminho A) | Publicar é instantâneo, cabem áudio, slides, imagens e transcrição. Custo: a arquitetura das aulas muda (seção 4) |
| 2 | **Editor visual** para escrever aulas | Recomendação: TipTap (seção 5) |
| 3 | **As aulas atuais são convertidas** para o banco | Um script de importação, com conferência (seção 4.3) |
| 4 | **Podcasts de resumo** com player e download | Player próprio, arquivos fora do site (seção 6) |
| 5 | **Quatro papéis**: aluno, contribuidor, criador, admin | Tabela de permissões na seção 3 |
| 6 | **Vídeos** do YouTube, Vimeo e TikTok | Lista fixa de provedores, clique para carregar (seção 7) |
| 7 | **Rota com outro nome** e gestão de usuários com promoção de papéis | Seção 2 |
| 8 | **Criador passa por revisão** antes de publicar, *a princípio*. As permissões de cada papel poderão ser alteradas depois | Permissões ficam num só lugar (`server/lib/can.ts`); uma tela para editá-las vem depois (fase 7) |
| 9 | **Tabela de permissões** da seção 3 aceita, com o **menor atrito e o máximo de segurança** | Criador não modera; contribuidor segue moderando; ações sensíveis pedem login recente |
| 10 | **TipTap com extensão de Markdown** | O Markdown é o formato canônico; o editor lê e escreve nele (seção 5) |
| 11 | **Podcast de resumo por módulo** | Um áudio por módulo, com transcrição (seção 6) |
| 12 | **Cloudflare R2** guarda áudio, **slides** e outras mídias | Envio por URL assinada, domínio próprio, CSP ajustada (seção 6.3) |
| 13 | **Slides são PDF hospedado** | Um bloco "slides" com visualizador de PDF e download |
| 14 | **TikTok** como complemento marcado | Só links no formato canônico; nunca a única fonte de uma aula |
| 15 | **SEO importa** | As aulas do banco são entregues já como HTML pronto, com título, descrição e sitemap vindos do banco (seção 4.1) |

## 2. A rota: `/gestao`

**Sim, vale separar, mas o motivo não é esconder.** Um endereço secreto não protege nada: quem decide é o servidor, em cada pedido. O que a rota própria dá de verdade:

- um espaço separado de `/conta` (que é das pessoas comuns), com sua própria navegação e identidade visual de "estou em modo de gestão";
- regras só dela: `noindex`, fora do `robots`, fora do cache do app instalável, cabeçalhos mais rígidos, e uma regra de limite de pedidos no firewall da Vercel só para `/api/gestao/*`;
- nenhum link público: o item "Gestão" só aparece no menu de quem tem permissão.

**Proposta:** página em `/gestao` e API em `/api/gestao/*`. A segurança de fato vem de: papel conferido no servidor em toda rota (já é assim, via `can()`), **registro de auditoria** de toda ação, confirmação nas ações destrutivas, e **segundo fator (TOTP)** para admin e criador antes de abrir a mais gente. O nome `/gestao` pode mudar; é uma constante.

## 3. Papéis e permissões

| Papel | O que é | Selo |
|---|---|---|
| **Aluno** (`student`) | Quem estuda | Aluno |
| **Contribuidor** (`contributor`) | Contribui com o site e com os projetos da Poppy | Contribuidor |
| **Criador** (`creator`) | Cria aulas e conteúdos do site | Criador |
| **Admin** (`admin`) | Cuida de tudo abaixo | Admin |

Proposta de permissões (marque o que quiser mudar):

| Ação | Aluno | Contribuidor | Criador | Admin |
|---|:-:|:-:|:-:|:-:|
| Comentar, anotar, perfil | ✔ | ✔ | ✔ | ✔ |
| Moderar comentários (esconder, fixar, silenciar) | | ✔ | | ✔ |
| Aparecer na página da equipe | | ✔ | ✔ | ✔ |
| Escrever e editar **os próprios rascunhos** de aula, post e mídia | | | ✔ | ✔ |
| **Publicar** aula ou post | | | ✔ (as próprias)* | ✔ (todas) |
| Editar aula ou post de outra pessoa | | | | ✔ |
| Ver a lista de usuários e mudar papéis | | | | ✔ |
| Banir, apagar dados (LGPD), ver registro de auditoria | | | | ✔ |

\* Decisão sua: o criador **publica direto** ou **envia para revisão** de um admin? A recomendação é revisão no começo (aulas erradas ficam no ar para pessoas que estão aprendendo) e liberar a publicação direta por criador conforme a confiança crescer. Dá para ser uma opção por pessoa.

Regras fixas: ninguém muda o próprio papel; ninguém promove ou rebaixa alguém de papel igual ou maior, exceto admin; o último admin não pode ser rebaixado nem apagado; mudar papel vale na hora (a sessão lê o papel do banco a cada pedido, como já é hoje).

## 4. Aulas no banco: o que muda

Hoje a aula é um arquivo Markdown no repositório e o catálogo está em `courses.ts`; o site estático já vem com o HTML pronto. Com as aulas no banco:

### 4.1 Como a página da aula é servida
Uma **página-casca** estática única (a mesma barra verde, painel "Conteúdo", pager, anotações, comentários, modo foco) que lê o endereço, busca a aula na API e desenha o texto. A Vercel reescreve `/aprender/:curso/:modulo/:licao` para essa casca. O catálogo (landing, painel de conteúdo, pager) também vem da API.

- **Vantagem:** publicou, está no ar.
- **Custo:** a aula deixa de ter HTML pronto no build. Para pessoas isso é quase invisível; para buscadores é pior. Se a busca importar, dá para pré-renderizar as aulas publicadas no servidor depois (função de borda), sem mudar o modelo de dados.
- **Desempenho:** a API devolve o HTML já pronto e limpo (não Markdown), guardado no banco no momento de salvar, então a página não carrega biblioteca de Markdown nem de realce de código.

### 4.2 O texto da aula
Formato canônico: **Markdown com os recursos que as aulas já usam** (caixas `::: tip`, abas de código `::: code-group`, etc.), mais os novos (vídeo, áudio, imagem com alternativa, slides). Motivos: (a) as aulas atuais **já são** nesse formato, então a conversão é direta; (b) a **apostila em Markdown** passa a ser gerada no servidor do mesmo texto; (c) o banco guarda texto legível, não um formato preso a uma biblioteca.

No salvamento, o servidor gera o HTML com uma lista fechada de elementos permitidos (sem HTML livre, sem script), com realce de código no servidor.

### 4.3 Converter as aulas atuais
Um script lê `site/aprender/**` e o catálogo e cria cursos, módulos e lições no banco, guardando o Markdown original. Depois **compara**: o HTML gerado do banco contra o que o site estático mostra hoje, aula por aula, e só então as aulas em arquivo saem do repositório. Durante a transição as duas fontes convivem (cada curso aponta para uma).

### 4.4 O que precisa ser adaptado
O teste de acessibilidade (axe) e os testes e2e das aulas passam a rodar com aulas vindas do banco (com dados de teste); a apostila vira um endereço da API; o app instalável guarda as aulas lidas como hoje (a API de aulas entra na lista de cache de páginas, sem tocar em nada privado); os comentários e anotações já usam o código da aula como chave, então **não mudam**.

## 5. O editor: TipTap, Quill ou Lexical

| | TipTap | Quill | Lexical |
|---|---|---|---|
| Base | ProseMirror | Delta próprio | Meta, baixo nível |
| Blocos próprios (caixa de dica, abas Ori/Aipo, vídeo, áudio) | **Fácil** (nós personalizados) | Difícil | Possível, com muito código |
| Saída | JSON ou HTML; Markdown com extensão | Delta (formato próprio) | JSON próprio |
| Acessibilidade | Boa, dá para ajustar | Razoável | Boa |
| Já no projeto | **Sim** (o editor de anotações) | Não | Não |

**Recomendação: TipTap.** Já está no repositório, então a barra de ícones, o tratamento de links e a saída em Markdown já existem e são reaproveitados. Os blocos novos (caixa, abas de código, vídeo, áudio, slides) viram nós do TipTap que gravam a sintaxe `:::` do formato da seção 4.2. Quill e Lexical trariam um formato intermediário a mais para converter.

O editor de aula terá: barra de ícones, inserir imagem (com texto alternativo obrigatório), inserir vídeo por endereço, inserir áudio da biblioteca de mídia, caixa (dica, atenção, nota), abas de código, e uma **prévia** com a cara da aula. Nada de HTML livre.

## 6. Podcasts de resumo e player de áudio

### 6.1 Por unidade ou por aula?
O modelo guarda o áudio **anexado a um módulo ou a uma aula**, então a decisão não trava nada. Minha sugestão: **por módulo** (uma "revisão" de 5 a 8 minutos), porque um resumo de cada aula repete o texto da própria aula e dá muito mais trabalho de gravar e transcrever. Se um módulo for grande, vale ter um resumo por aula só nele.

### 6.2 O player
Um player **próprio e acessível** em volta do `<audio>` do navegador (nada de embed de terceiros):

- reproduzir/pausar, avançar e voltar 15 s, barra de progresso com teclado, **velocidade** (0,75×, 1×, 1,25×, 1,5×, 2×), volume;
- **transcrição sempre ao lado** (recolhível), obrigatória para publicar; o texto da transcrição também entra na apostila;
- botão **Baixar (MP3)** e duração visível;
- lembra onde você parou, como o progresso das aulas;
- sem reprodução automática; funciona com leitor de tela e teclado; respeita "reduzir movimento".

### 6.3 Onde hospedar os arquivos (gratuito)
O site não deve guardar áudio no banco nem na Vercel: fala em MP3 mono a 64 kbps dá cerca de 29 MB por hora, o que é pouco, mas a transferência é o que pesa quando muita gente ouve.

| Opção | Custo | Download direto | Dono do arquivo | Observações |
|---|---|---|---|---|
| **Cloudflare R2** | 10 GB de graça e **sem cobrança de saída** | Sim | Você | A melhor em escala, mas exige cartão na conta |
| **Backblaze B2** (+ Cloudflare) | 10 GB de graça | Sim | Você | Também costuma pedir cadastro completo |
| **Internet Archive** | Grátis | Sim | Você (público) | Sem cartão, bom para conteúdo aberto; velocidade irregular; o arquivo fica público no acervo |
| **Spotify for Creators** (ex-Anchor) | Grátis | Só pelo feed RSS | Plataforma | Publica também no Spotify, Apple Podcasts e YouTube Music; o endereço do MP3 vem do RSS e pode mudar |
| **Vercel Blob** | Limite pequeno no plano gratuito | Sim | Você | Simples (mesma conta), mas o teto de transferência gratuita é baixo |

**Recomendação:** dois passos que não se excluem.
1. **O site só guarda o endereço do áudio e o provedor** (uma lista de hosts permitidos). Trocar de plataforma depois vira editar o endereço, sem mexer nas aulas.
2. Começar pelo **Internet Archive** se não quiser cadastrar cartão (funciona hoje, com ressalva de velocidade), e migrar para **R2** quando o público crescer. Se quiser distribuir também como podcast de verdade, **Spotify for Creators** gera o feed RSS sem custo, e o site continua com o seu player apontando para o MP3.

O CSP ganha `media-src` só para os hosts da lista. O download de outro domínio abre o arquivo para salvar; para forçar o "salvar como" o host precisa mandar o cabeçalho certo (R2 e Internet Archive mandam).

## 7. Vídeo: YouTube, Vimeo e TikTok

Regra geral: campo "endereço do vídeo". O servidor reconhece só endereços **de formato conhecido** de cada provedor, guarda o **código do vídeo** (não o endereço colado) e monta a incorporação ele mesmo. A página mostra um cartão com título, duração e **"Carregar vídeo"**: nada de terceiro carrega até o clique, o que protege a privacidade e o desempenho. Transcrição e "o que você aprende" continuam obrigatórios para publicar.

| Provedor | Incorporação | Observações |
|---|---|---|
| **YouTube** | `youtube-nocookie.com` | Legendas e velocidade nativas. O mais indicado |
| **Vimeo** | `player.vimeo.com` com `dnt=1` | Bom controle; vídeos privados só abrem onde o dono liberou |
| **TikTok** | `tiktok.com/embed/v2/<id>` | **Funciona, mas com ressalvas:** formato vertical, carrega rastreadores de terceiros mesmo após o clique, pouca acessibilidade (legendas nem sempre), e links curtos (`vm.tiktok.com`) não são aceitos, só o endereço completo do vídeo |

Por causa das ressalvas, sugiro que o TikTok entre marcado como "complemento" (nunca o único recurso da aula) e que o painel **avise** que ele não atende a todos os critérios de acessibilidade. O CSP ganha `frame-src` só para esses três domínios.

## 8. Mídia em geral

Uma **biblioteca de mídia** no painel: imagens (reprocessadas no servidor para WebP, sem metadados, **texto alternativo obrigatório**), áudios (endereço + transcrição + duração), slides e vídeos (endereço do provedor). Cada item tem dono, data e onde está sendo usado, para não apagar o que uma aula usa.

**Slides:** duas formas, ambas com alternativa em texto: (a) **PDF** hospedado (o player mostra o PDF no próprio site, com link de download); (b) **incorporação** de apresentação (Google Slides, Canva) por provedor da lista. Qual você prefere? Se for criar os slides no próprio editor, dá para ter slides em Markdown (uma seção por slide).

## 9. Modelo de dados (rascunho)

- `users.role` ganha `creator`; `users.suspended_at`
- `courses`, `course_modules`, `lessons` (slug, ordem, estado: rascunho, revisão, publicado, em breve; minutos; `body_md`, `body_html`; autor; versões)
- `lesson_versions` (histórico: quem mudou, quando, texto anterior)
- `media` (tipo: imagem, áudio, slide, vídeo; provedor; código/endereço; alternativa; transcrição; duração; dono)
- `media_links` (onde cada mídia é usada: aula ou módulo)
- `posts` (blog, mesmo formato das aulas)
- `audit_log` (ator, ação, alvo, antes, depois, quando)

Migrações escritas à mão, como as atuais, com teste de servidor para cada regra de permissão.

## 10. Fases

1. **Base da gestão** *(pronta)*: papel **criador**, rota `/gestao`, guarda no servidor, **registro de auditoria**, e **Usuários** (busca, ver papel, **promover e rebaixar**, suspender). Moderação existente linkada de dentro.
2. **Modelo de conteúdo**: tabelas de cursos, módulos, lições, versões; renderizador seguro (Markdown para HTML); API de aulas; **script de importação** das aulas atuais e comparação.
3. **Aulas lidas do banco**: a página-casca, catálogo, painel de conteúdo, pager e apostila vindos da API; convivência com as aulas em arquivo, curso a curso.
4. **Editor TipTap** com os blocos das aulas, revisão e publicação.
5. **Mídia**: biblioteca, imagens, player de **áudio**, vídeo (3 provedores), slides.
6. **Blog no banco** e **fórum**, quando existir.
7. **Endurecer**: TOTP para admin e criador, limites de pedidos por ação, exportação do registro.

Cada fase é um PR pequeno, com testes, que pode ser usado sozinho.

## 11. O que ainda falta

As sete perguntas da versão 2 foram respondidas (decisões 8 a 15). Restam:

1. **Rebaixar admin:** hoje um admin **não** muda o papel de outro admin (regra de segurança que já existia). Quer manter assim, ou permitir com login recente e registro?
2. **Criar o bucket no Cloudflare R2**, o domínio de mídia (por exemplo `midia.poppy.lat`) e a chave de acesso. A chave entra como variável de ambiente na Vercel; **nunca** no chat nem no repositório.
3. **Regras de ranking e selos** (ainda sem resposta) e **caixa de mensagens** entre pessoas (depois do fórum).

### Como o SEO entra (decisão 15)

- A página da aula é entregue já com o HTML da aula, não só um esqueleto que o navegador preenche depois.
- Título, descrição, `canonical` e dados estruturados (`Course` e `LearningResource`) saem do banco.
- O `sitemap.xml` passa a incluir as aulas do banco, e rascunhos ficam de fora (e com `noindex`).
- As aulas atuais, em arquivo, continuam como estão até o curso correspondente ser importado; o endereço não muda.

### Como o R2 entra (decisão 12)

- O navegador envia o arquivo **direto** ao R2 por uma URL assinada, de validade curta, criada pelo servidor depois de checar o papel. O arquivo não passa pelo servidor do site.
- O servidor confere tipo, extensão e tamanho máximo antes de assinar, e depois confere o que chegou.
- Só tipos permitidos: MP3 e M4A (áudio), PDF (slides), PNG, JPG, WebP (imagens). Nada de SVG nem HTML.
- Domínio próprio para a mídia, e a CSP passa a permitir só esse domínio em `media-src` e `img-src`.
