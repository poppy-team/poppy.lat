# Aprender: recursos de acessibilidade, áudio e vídeo-aulas

Data: 2026-09-30. Complementa o [plano do Aprender](aprender-plano.md) e a [biblioteca de cursos](aprender-biblioteca.md). É um desenho: **nada disto está implementado além do que a seção 6 diz.**

> **Em uma frase:** o texto continua sendo a lição de verdade, e cada recurso (ouvir, ver, ler de outro jeito) é uma **opção a mais**, nunca o único caminho. Todo vídeo tem transcrição, toda imagem tem descrição e nada de terceiros carrega sem decisão nossa.

---

## 1. Princípios

1. **Texto primeiro.** A lição em texto é a versão completa. Áudio, vídeo e resumos derivam dela, e não o contrário.
2. **Opção, não obrigação.** Quem quer só ler, lê. Quem quer ouvir, ouve. A escolha fica salva (como já acontece com tamanho, espaçamento, fonte e quebra de linha em código).
3. **Sem transcrição, sem vídeo.** Nenhuma vídeo-aula entra no site sem transcrição em texto e legendas.
4. **WCAG 2.2 nível AA** como piso, com a [auditoria](aprender-auditoria-acessibilidade.md) refeita a cada mudança grande.
5. **Privacidade por padrão.** Nada de rastreadores, nada de terceiros carregando antes de a pessoa pedir.

---

## 2. Ouvir a lição (áudio)

Feito em três degraus, do mais barato ao mais cuidadoso. Cada um funciona sem o seguinte.

| Degrau | O que é | Vantagens | Limites |
|---|---|---|---|
| **1. Voz do navegador** | Botão "Ouvir esta lição" usando a Web Speech API (`speechSynthesis`), sem servidor e sem terceiros | Custo zero, funciona offline em vários aparelhos, acompanha o texto na tela | A qualidade da voz depende do aparelho e do sistema; pode faltar voz em português |
| **2. Áudio gerado no build** | Um arquivo de áudio por lição, gerado por síntese de voz no build e servido como arquivo estático, com player próprio (velocidade, pausa, voltar 15 s) | Voz igual para todo mundo, funciona em qualquer aparelho | Exige escolher um serviço ou modelo de voz com licença clara; aumenta o tamanho do site |
| **3. Narração humana** | Lições narradas por pessoas (equipe ou comunidade) | Melhor qualidade e afeto | Custo de tempo; precisa de revisão a cada mudança na lição |

Regras de leitura em voz alta (valem para os três):
- **Blocos de código não são lidos linha a linha.** A voz diz "bloco de código em Ori, 7 linhas" e a pessoa escolhe ouvir ou pular. O código literal fica sempre disponível na tela.
- Símbolos falados por extenso só onde ajudam ("aspas", "abre parênteses"), ativados por uma opção.
- Cada bloco de código e cada título são pontos de parada, para que a pessoa navegue por eles.
- Destaque do trecho lido, com respeito a `prefers-reduced-motion`.

---

## 3. Vídeo-aulas

O espaço já existe (`.lesson-media`, 16:9, com variante mais larga), mas **nenhum vídeo é carregado hoje**. Para começar:

- **Contêiner de vídeo na lição**, com uma sintaxe própria no Markdown (por exemplo `::: video`), que recebe provedor, identificador, título, duração, autor, licença e link da fonte. Quem escreve a lição não cola HTML de terceiros.
- **Lista de provedores permitidos** (começando por `youtube-nocookie.com`) e **`frame-src` na Content-Security-Policy** limitado a eles. Qualquer provedor novo passa por revisão de segurança.
- **Clique para carregar:** a página mostra uma capa e um botão "Assistir". O iframe só é criado depois do clique, então nada de terceiros carrega, nem cookies, antes da decisão da pessoa. Serve também para quem prefere economizar dados.
- **Transcrição obrigatória** logo abaixo do vídeo (em `<details>` aberto por padrão para leitores de tela, com marcação de tempo). Para vídeos nossos, também legendas `.vtt`.
- **Legendas dos vídeos de terceiros:** só entram se tiverem legenda em português (ou se escrevermos a transcrição). Descrição de imagens importantes que aparecem só no vídeo entra no texto.
- **Controles acessíveis:** o player do provedor deve permitir teclado e legendas; se não permitir, escolhemos outro provedor ou hospedamos.
- **Sem autoplay**, sem vídeo em loop, sem som ao abrir.

Metadados da lição (frontmatter), previstos: `media` (lista de vídeos), `transcript`, `audio`, `captions`, `license`, `author`.

---

## 4. Outros recursos, em ordem de valor

1. **Resumo em linguagem simples** no topo de cada lição (3 frases), para quem precisa de uma entrada mais leve.
2. **Tema de alto contraste** e **redução de movimento** que respeite a preferência do sistema.
3. **Espaçamento, tamanho e fonte** já existem; falta **largura do texto** e **cor de fundo** (papel, creme, escuro).
4. **Atalhos de teclado** documentados (abrir o painel de conteúdo, próxima lição, alternar foco).
5. **Libras:** avaliar o VLibras (widget do governo federal). Ele carrega script de terceiros, então só entra depois de revisão de privacidade e, no mínimo, com clique para ativar. Vídeos em Libras feitos por pessoas surdas da comunidade são preferíveis.
6. **Descrição textual de diagramas e imagens**: alt obrigatório revisado a cada lição; diagramas complexos ganham descrição longa.
7. **Exercícios com tempo livre:** nada de contagem regressiva, nada de "streak".

---

## 5. Desenho técnico

- **Catálogo:** cada lição ganha campos opcionais `audio`, `video`, `transcript`; o catálogo (`courses.ts`) continua sendo a fonte da lista, do painel de conteúdo e da apostila.
- **Apostila:** a transcrição entra no arquivo, e a apostila em PDF (futura) sai do mesmo Markdown.
- **Componentes:** `LessonMedia` (vídeo com clique para carregar), `LessonAudio` (player), `Transcript`. Todos com teste de teclado e de leitor de tela no Playwright.
- **Segurança:** `frame-src` e `media-src` na CSP só com os provedores da lista; nenhum script de terceiro; `sandbox` e `referrerpolicy="strict-origin-when-cross-origin"` no iframe; `loading="lazy"`.
- **Privacidade:** o que é de terceiros entra no texto de privacidade e só carrega depois do clique.

---

## 6. O que já existe e o que vem

Já existe: leitura ajustável (tamanho, espaçamento, fonte, quebra de linha em código, modo foco), estrutura própria para aulas com espaço reservado para vídeo, painel de conteúdo com teclado e foco preso, apostila em Markdown.

Ordem sugerida:
1. Auditoria de acessibilidade do site e correções (feita nesta rodada).
2. Voz do navegador (degrau 1 do áudio) e resumo em linguagem simples.
3. Contêiner de vídeo com clique para carregar, CSP e transcrição obrigatória.
4. Áudio gerado no build.
5. Alto contraste, largura do texto e cores de fundo.
6. Libras, depois de revisão de privacidade.

## 7. Decisões que dependem de você

- Qual é a prioridade entre áudio (degrau 1) e vídeo?
- Aceitamos síntese de voz de um serviço pago, ou só voz do navegador por enquanto?
- Quem revisa a acessibilidade com pessoas reais (teste com usuários de leitor de tela, pessoas com TDAH, dislexia e autismo)? Recomendação: convidar a comunidade a testar cada módulo antes de publicar.
