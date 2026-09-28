---
title: Your first program
description: Write a first output and learn the documented Aipo workflows.
sidebar:
  order: 3
---

> Source: [`docs/getting-started/first-program.md`](https://github.com/poppy-team/aipo-lang/blob/e9ec458cc39c6da005cd81e959360ec89648b8c7/docs/getting-started/first-program.md) · revision `e9ec458cc39c6da005cd81e959360ec89648b8c7` · blob `4ae0190c693fb552243c4d693987240f3479c38b` · MIT license.
>
> Static reading copy. Full, canonical documentation remains in Aipo’s repository.

**Português:** [Seu primeiro programa](/docs/aipo/first-program/)

This guide walks through writing, checking, compiling, and running a first program **in an environment with Aipo installed**. Commands below are documentation examples; this page does not execute code.

## Hello, world

Create a file named `hello.aipo`:

```aipo
# hello.aipo
io.println("Hello from Aipo!")
```

Run it in a terminal:

```bash
aipo run hello.aipo
```

Expected output:

```text
Hello from Aipo!
```

## Structs, invariants, and methods

The following example models an account with a non-negative balance invariant:

```aipo
struct Account {
holder
account_number
var balance = 0.0
}
impl Account {
init(holder, account_number = 0, balance = 0.0) {
self.holder = holder
self.account_number = account_number
self.balance = balance
}
invariant {
self.balance >= 0.0
}
fn deposit(var self, amount: Float) {
if amount <= 0.0 {
return fail("Deposit amount must be positive")
}
self.balance += amount
}
}
```

## Inspect bytecode

Aipo documentation presents the `aipo disasm` command to inspect instructions and source coordinates:

```bash
aipo disasm account.aipo
```

## Compile to JavaScript

The JavaScript backend can be used in the documented local workflow:

```bash
aipo build account.aipo -o dist/account.js
node dist/account.js
```

:::note[No browser execution]
This page displays text snippets only. To compile or run Aipo, use the appropriate tool outside the website and consult the [canonical installation guide](https://github.com/poppy-team/aipo-lang/blob/e9ec458cc39c6da005cd81e959360ec89648b8c7/docs/getting-started/installation.md).
:::
