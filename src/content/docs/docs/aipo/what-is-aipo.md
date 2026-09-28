---
title: O que é Aipo?
description: Uma visão geral da linguagem Aipo, de seu sistema de tipos e de seus contratos.
sidebar:
  order: 2
---

> Fonte: [`docs/getting-started/what-is-aipo.md`](https://github.com/poppy-team/aipo-lang/blob/e9ec458cc39c6da005cd81e959360ec89648b8c7/docs/getting-started/what-is-aipo.md) · revisão `e9ec458cc39c6da005cd81e959360ec89648b8c7` · blob `b9417f44d84e5ddddfcd9d4c4af51819b755df75` · licença MIT.
>
> Cópia estática para leitura. A documentação completa e canônica permanece no repositório de Aipo.

**English:** [What is Aipo?](/en/docs/aipo/what-is-aipo/)

O **Aipo** é uma linguagem de programação moderna de propósito geral, com tipagem dinâmica e forte, dotada de suporte nativo a contratos de assinatura e invariantes estruturais.

Projetada com uma filosofia de **simplicidade, robustez e previsibilidade**, Aipo foi construída do zero em Rust.

## Pilares fundamentais

### Tipagem dinâmica e forte

No Aipo, valores possuem tipos concretos e o sistema não realiza conversões arbitrárias ou silenciosas entre tipos incompatíveis:

```aipo
let x = "42"
let y = 10
// Erro de tipo em tempo de execução:
// O operador '+' não concatena String e Int implicitamente.
let z = x + y
```

Para concatenar ou converter valores, exige-se intenção explícita ou formatação declarada.

### Contratos estruturais e invariantes

O hook `invariant()` pode declarar uma regra estrutural junto à implementação de uma estrutura:

```aipo
struct Temperature {
var celsius = 0.0
}
impl Temperature {
invariant {
self.celsius >= -273.15 # Não pode ser inferior ao zero absoluto
}
}
```

Em blocos transacionais `attempt { ... } failed err { ... }`, uma mutação que viole a invariante pode ser revertida.

### Concorrência determinística

Aipo descreve um modelo baseado em fibras cooperativas e tempo virtual. Chamadas assíncronas usam `async fn` e combinadores de tarefas, como `task.spawn`, `task.sleep`, `task.all` e `task.race`.

### Dois destinos: VM e JavaScript

1. **VM de bytecode em Rust:** executa bytecode e permite inspecionar instruções.
2. **Backend JavaScript:** emite JavaScript moderno com um runtime modular.

:::note[Exemplo estático]
Os trechos desta página ilustram a sintaxe documentada. Eles não são compilados nem executados no navegador.
:::
