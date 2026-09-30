---
title: "Depuração"
description: "O depurador de terminal, o servidor DAP e a integração com editores."
project: ori
category: guides
locale: pt-BR
sourcePath: "docs/guides/debugging.pt-BR.md"
sourceBlob: "3ae26de8d8b8d3d28b2fe5af0603586b2c54b044"
revision: "42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f"
license: "MIT"
---
::: info Cópia estática
Copiado de `docs/guides/debugging.pt-BR.md` em [https://github.com/poppy-team/ori-lang](https://github.com/poppy-team/ori-lang) (MIT).
Fixado na revisão `42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f`, blob `3ae26de8d8b8d3d28b2fe5af0603586b2c54b044`.
O repositório de origem permanece canônico; esta cópia é atualizada por um pull request de sincronização, não em tempo real.
:::
# Depuração de programas Ori

> **English:** [debugging.md](/en/ori/docs/guides/manual/debugging)

O Ori oferece um debugger nativo cooperativo e um servidor DAP. Ambos usam os
snapshots gerados pelo compilador.

## Terminal

```text
ori debug examples/cli_args/main.orl --breakpoint 41
```

Use `c` para continuar, `s` para avançar uma linha instrumentada e `q` para
encerrar o alvo. O adapter mostra localização, stack e variáveis locais.

## DAP

```text
ori debug --dap
```

O adapter atende inicialização, breakpoints, continue/step, threads, stack,
scopes, variables, evaluate e disconnect. Campos de structs, payloads de
optional/result/enums, collections suportadas, frames async e captures de
closures aparecem no catálogo. `evaluate` não executa código do alvo.

O build nativo também grava `program.debug.json`. A extensão VS Code inicia o
DAP automaticamente; o Zed atual oferece LSP, mas não wiring automático do
debugger. Use `ori doctor` para problemas de runtime ou linker.
