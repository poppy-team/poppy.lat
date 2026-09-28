---
title: What is Aipo?
description: An overview of the Aipo language, its type system, and its contracts.
sidebar:
  order: 2
---

> Source: [`docs/getting-started/what-is-aipo.md`](https://github.com/poppy-team/aipo-lang/blob/e9ec458cc39c6da005cd81e959360ec89648b8c7/docs/getting-started/what-is-aipo.md) · revision `e9ec458cc39c6da005cd81e959360ec89648b8c7` · blob `d7e78ce87a0d2b39bc7b39966e51077f09f92bd9` · MIT license.
>
> Static reading copy. Full, canonical documentation remains in Aipo’s repository.

**Português:** [O que é Aipo?](/docs/aipo/what-is-aipo/)

**Aipo** is a modern general-purpose programming language featuring dynamic and strong typing, paired with native signature contracts and structural invariants.

It was designed around **clarity, robustness, and predictability**, and built from the ground up in Rust.

## Core pillars

### Dynamic and strong typing

In Aipo, values have concrete types and the runtime does not perform arbitrary or hidden conversions between incompatible types:

```aipo
let x = "42"
let y = 10
// Runtime type fault:
// The '+' operator does not implicitly concatenate String and Int.
let z = x + y
```

Converting or concatenating values requires clear programmer intent.

### Structural invariants and contracts

The `invariant()` hook can declare a structural rule alongside an implementation:

```aipo
struct Temperature {
var celsius = 0.0
}
impl Temperature {
invariant {
self.celsius >= -273.15 # Cannot be below absolute zero
}
}
```

Inside `attempt { ... } failed err { ... }` transaction blocks, a mutation that violates an invariant can be rolled back.

### Deterministic concurrency

Aipo describes a model based on cooperative fibers and virtual time. Async calls use `async fn` and task combinators such as `task.spawn`, `task.sleep`, `task.all`, and `task.race`.

### Two targets: VM and JavaScript

1. **Rust bytecode VM:** executes bytecode and supports instruction inspection.
2. **JavaScript backend:** emits modern JavaScript with a modular runtime.

:::note[Static example]
Code snippets on this page illustrate documented syntax. They are not compiled or executed in the browser.
:::
