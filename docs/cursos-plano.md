# Cursos do poppy.lat: plano

Data: 2026-09-30. Autor: Claude, a pedido de Raillen.

> **Em uma frase:** uma escola dentro do site, com um curso comum que serve para Ori e Aipo ao mesmo tempo, e depois uma trilha para cada linguagem, do uso até a implementação. Tudo guiado por projetos e escrito para quem tem TDAH, dislexia, outras neurodivergências ou nunca programou.

Inspiração de estrutura: a área de curso do orilang.vercel.app (curso por módulos, receitas curtas, projetos guiados, livro de "construa uma linguagem"). O conteúdo de lá não tem licença declarada, então **nada é copiado**: só a ideia de organização. Tudo aqui é escrito do zero.

---

## 1. Mapa dos cursos

```
/cursos
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

- **Markdown no próprio repositório do site**, em `site/cursos/` (PT) e `site/en/cursos/` (EN). Diferente da documentação, o curso é conteúdo original do poppy.lat, então não passa pelo importador.
- **Frontmatter de cada lição:** `course`, `module`, `lesson`, `duration`, `level`, `project`, `objectives`, `testedWith` (versão da Ori/Aipo em que o código foi testado).
- **Abas Ori | Aipo** com o `::: code-group` que o VitePress já tem, e a escolha lembrada entre páginas.
- **Caixas padronizadas:** Checkpoint, Se travar, Onde elas diferem, Palavras novas.
- **Idiomas:** PT primeiro. EN entra por módulo completo, nunca meia lição. Uma lição sem tradução mostra um aviso na versão EN apontando para a PT.
- **Sempre aprimorado:** cada lição tem no rodapé "Esta lição te ajudou?" e "Algo confuso?", que abre uma issue no GitHub já com o nome da lição. Um arquivo `CHANGELOG` do curso registra o que mudou.
- **Código que não apodrece (fase 3):** um script extrai os blocos de código das lições e roda com `ori run` e `aipo run` na CI, comparando com a saída do Checkpoint. Assim, quando a linguagem muda, a lição quebrada aparece antes de chegar a quem estuda.

---

## 6. Futuro: conta, playground e exercícios

Nada disso entra agora. O esqueleto já nasce preparado: progresso e preferências ficam num único módulo, que hoje salva no navegador e depois passa a salvar na conta.

1. **Progresso local** (já no esqueleto): lições concluídas e preferências no `localStorage`.
2. **Conta de usuário:** login com GitHub ou e-mail. O site é estático na Vercel, então isso pede um serviço de autenticação e um banco pequeno (por exemplo Supabase ou Vercel + Postgres). Sincroniza progresso e preferências entre aparelhos.
3. **Playground interativo:**
   - Aipo tem um backend JavaScript e um caminho Wasm, então dá para rodar **no navegador**, sem servidor.
   - Ori compila para nativo; no navegador precisaria de um alvo Wasm ou de um servidor com sandbox. Isso é uma decisão para o time da Ori.
4. **Exercícios por projeto:** enunciado, código inicial no playground, testes automáticos que dizem o que falta com linguagem gentil, e dicas em camadas (dica 1, dica 2, solução).

---

## 7. Fases

| Fase | O que entra |
|---|---|
| **1 (este PR)** | Rota `/cursos` com landing, mapa das trilhas, barra lateral própria, 1 lição de exemplo completa, preferências de leitura, modo foco e progresso local. Só PT. |
| 2 | Curso 0 completo e Módulo 1 do curso comum (PT). |
| 3 | Módulos 2 a 4 do curso comum; teste automático dos exemplos na CI. |
| 4 | Curso "Como uma linguagem funciona"; EN do que já existir. |
| 5 | Trilhas de uso de Ori e Aipo. |
| 6 | Trilhas de implementação; conta e playground. |

---

## 8. Decisões que ficam com você

1. **Nome da área:** "Cursos" (recomendo, é direto) ou "Aprender" / "Escola".
2. **Quem revisa o código das lições:** o time de cada linguagem precisa confirmar os exemplos antes de publicar, porque as duas linguagens ainda mudam (Ori S3, Aipo S2).
3. **Inglês:** começar só em PT (recomendo) ou escrever PT e EN juntos desde o módulo 1.
