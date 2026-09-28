---
title: Seu primeiro programa
description: Escreva uma primeira saída e conheça os fluxos documentados de Aipo.
sidebar:
  order: 3
---

> Fonte: [`docs/getting-started/first-program.md`](https://github.com/poppy-team/aipo-lang/blob/e9ec458cc39c6da005cd81e959360ec89648b8c7/docs/getting-started/first-program.md) · revisão `e9ec458cc39c6da005cd81e959360ec89648b8c7` · blob `7914f423d7c025d6c935c154276b6786e507beab` · licença MIT.
>
> Cópia estática para leitura. A documentação completa e canônica permanece no repositório de Aipo.

**English:** [Your first program](/en/docs/aipo/first-program/)

Neste guia, vamos escrever, verificar, compilar e executar um primeiro programa **em um ambiente com Aipo instalado**. Os comandos abaixo são exemplos documentais: esta página não executa código.

## Olá, mundo

Crie um arquivo `hello.aipo`:

```aipo
# hello.aipo
io.println("Olá do Aipo!")
```

No terminal, execute:

```bash
aipo run hello.aipo
```

Saída esperada:

```text
Olá do Aipo!
```

## Estruturas, invariantes e métodos

O exemplo a seguir modela uma conta com uma invariante de saldo não negativo:

```aipo
struct Conta {
titular
numero
var saldo = 0.0
}
impl Conta {
init(titular, numero = 0, saldo = 0.0) {
self.titular = titular
self.numero = numero
self.saldo = saldo
}
invariant {
self.saldo >= 0.0
}
fn depositar(var self, valor: Float) {
if valor <= 0.0 {
return fail("Valor de depósito deve ser positivo")
}
self.saldo += valor
}
}
```

## Inspecionar bytecode

A documentação de Aipo apresenta o comando `aipo disasm` para inspecionar instruções e coordenadas do código-fonte:

```bash
aipo disasm conta.aipo
```

## Compilar para JavaScript

O backend JavaScript pode ser usado no fluxo local documentado:

```bash
aipo build conta.aipo -o dist/conta.js
node dist/conta.js
```

:::note[Sem execução no navegador]
Esta página apenas exibe trechos de texto. Para compilar ou executar Aipo, use a ferramenta apropriada fora do site e consulte as [instruções canônicas de instalação](https://github.com/poppy-team/aipo-lang/blob/e9ec458cc39c6da005cd81e959360ec89648b8c7/docs/getting-started/installation.md).
:::
