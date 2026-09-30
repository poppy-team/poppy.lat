---
title: "Seu primeiro programa"
description: "Escreva e rode um programa que mostra uma frase no terminal, em Ori ou em Aipo."
locale: pt-BR
course: pensar-em-codigo
module: primeiro-programa
lesson: ola
duration: 8
level: iniciante
project: "Cartão de apresentação no terminal"
objectives:
  - Criar um arquivo de código
  - Rodar um programa pelo terminal
  - Entender o que cada linha do programa faz
# Os exemplos seguem os guias oficiais: Ori "Tour da linguagem" (ori-lang 42e1817)
# e Aipo "Primeiro programa" (aipo-lang 3a5ce67). Revisar quando as linguagens mudarem.
examplesFrom:
  ori: "42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f"
  aipo: "3a5ce6737d42ae75470f7798680ebc95b3ac761c"
---

# Seu primeiro programa

**Nesta lição você vai:**

1. Criar um arquivo de código.
2. Rodar esse arquivo pelo terminal.
3. Entender o que cada linha faz.

**O que você vai construir:** um programa que mostra uma frase de apresentação no terminal. É a primeira peça do **cartão de apresentação**, o projeto deste módulo.

::: info Escolha a sua linguagem
Os exemplos aparecem em duas abas: **Ori** e **Aipo**. Escolha uma e siga com ela até o fim. O site lembra a sua escolha nas próximas lições. Você pode trocar quando quiser.
:::

## Antes de começar

Você precisa de duas coisas:

- **A linguagem instalada.** Siga o guia de instalação da [Ori](/ori/docs/guides/getting-started/install) ou da [Aipo](/aipo/docs/guides/getting-started/installation) e volte aqui.
- **Um terminal aberto em uma pasta vazia.** O terminal é a janela onde você digita comandos. Crie uma pasta chamada `cartao` e abra o terminal dentro dela.

## Passo 1: crie o arquivo

Um programa é um arquivo de texto com instruções. A extensão no fim do nome diz qual linguagem ele usa.

Crie um arquivo novo na pasta `cartao`:

- Em Ori, com o nome `cartao.orl`.
- Em Aipo, com o nome `cartao.aipo`.

## Passo 2: escreva o programa

Copie o código para dentro do arquivo e salve.

::: code-group

```ori [Ori]
module app.cartao

import ori.io as io

main()
    io.println("Olá! Eu sou a Ana.")
end
```

```aipo [Aipo]
io.println("Olá! Eu sou a Ana.")
```

:::

Troque **Ana** pelo seu nome. Mantenha as aspas `"` no começo e no fim da frase.

## Passo 3: rode o programa

No terminal, digite o comando e aperte **Enter**:

::: code-group

```bash [Ori]
ori run cartao.orl
```

```bash [Aipo]
aipo run cartao.aipo
```

:::

`run` quer dizer "rodar". O comando pede à linguagem para ler o arquivo e fazer o que ele manda.

::: tip Checkpoint
Se apareceu esta linha no terminal, deu certo:

```text
Olá! Eu sou a Ana.
```

Com o seu nome no lugar de Ana.
:::

::: warning Se travar
- **"command not found" ou "não é reconhecido como comando":** a linguagem não está instalada, ou o terminal foi aberto antes da instalação. Feche o terminal, abra de novo e tente outra vez.
- **"file not found" ou "arquivo não encontrado":** o terminal está em outra pasta. Confira se o nome do arquivo está igual, com a extensão, e se o terminal está dentro da pasta `cartao`.
- **Um erro apontando para a linha da frase:** confira se a frase começa e termina com aspas `"`.
:::

## O que cada linha faz

Leia só a aba da linguagem que você escolheu.

::: code-group

```ori [Ori]
module app.cartao        -- 1. o nome deste arquivo dentro do projeto

import ori.io as io      -- 2. traz as ferramentas de entrada e saída, com o nome curto "io"

main()                   -- 3. o começo do programa: é aqui que ele começa a rodar
    io.println("Olá! Eu sou a Ana.")   -- 4. mostra a frase e pula para a próxima linha
end                      -- 5. o fim do bloco que começou em main()
```

```aipo [Aipo]
io.println("Olá! Eu sou a Ana.")   # mostra a frase e pula para a próxima linha
```

:::

Em Ori, tudo depois de `--` é um **comentário**. Em Aipo, tudo depois de `#` é um comentário. O computador ignora comentários: eles são notas para quem lê. Você vai usar isso na lição 3.

A parte mais importante é igual nas duas linguagens: `io.println("...")`.

- `io` é um grupo de ferramentas para **entrada e saída** (em inglês, *input/output*): ler do teclado, mostrar no terminal.
- `println` é a ferramenta que **imprime uma linha**: mostra o texto e pula para a linha de baixo.
- O texto entre aspas é uma **string**, o nome que as linguagens dão para um pedaço de texto.

::: details Onde elas diferem
Em **Aipo**, o arquivo pode começar direto pela instrução. A linguagem já conhece `io` e roda as linhas de cima para baixo.

Em **Ori**, todo arquivo diz o seu nome com `module`, traz o que vai usar com `import` e coloca as instruções dentro de `main()` ... `end`. Dá mais texto no começo, mas deixa claro, logo no topo, de onde cada coisa vem. A trilha de Ori explica por quê.
:::

## Resumo

- Um programa é um arquivo de texto com instruções.
- O comando `run` pede para a linguagem executar o arquivo.
- `io.println("...")` mostra uma linha de texto no terminal.

## Palavras novas

- **Terminal:** a janela onde você digita comandos para o computador.
- **Comando:** uma instrução digitada no terminal, como `ori run cartao.orl`.
- **String:** um pedaço de texto dentro do código, sempre entre aspas.
- **Comentário:** uma nota no código para quem lê. O computador ignora.

## Próximo passo

Na próxima lição, o cartão ganha mais linhas: nome, o que você faz e onde te encontrar.
