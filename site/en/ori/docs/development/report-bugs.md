---
title: "How to report bugs"
description: "What to include in a bug report so it can be reproduced."
project: ori
category: development
locale: en
sourcePath: "docs/guides/report-bugs.md"
sourceBlob: "deda484d1a6ab4c06e3f342256bb4d3373b9d2ce"
revision: "42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f"
license: "MIT"
---
::: info Cópia estática
Copiado de `docs/guides/report-bugs.md` em [https://github.com/poppy-team/ori-lang](https://github.com/poppy-team/ori-lang) (MIT).
Fixado na revisão `42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f`, blob `deda484d1a6ab4c06e3f342256bb4d3373b9d2ce`.
O repositório de origem permanece canônico; esta cópia não é atualizada automaticamente.
:::
# How to report bugs

> Status: practical policy for Ori **S3 + inference B / workspace 0.3.8-dev**
> **Portuguese:** [report-bugs.pt-BR.md](/ori/docs/development/report-bugs)

A good report lets someone reproduce the issue with a few commands.

## Language / type checker

Include:

- `ori --version`
- OS (Windows / Linux / macOS)
- minimal `.orl` file
- command, e.g. `ori check main.orl`
- full diagnostic output

Use this for parser, checker, imports, generics, traits, matching, `try`, ARC.

## Stdlib / runtime

Also include:

- module (`ori.fs`, `ori.json`, …)
- whether it fails under `ori run`, `ori compile`, or both
- for memory issues: `ORI_TEST_LEAK_CHECK=1` if relevant

## Tooling

`ori fmt`, `ori doc`, `ori new`, REPL, LSP, VS Code / Zed extensions, release
packages.

Include exact command, minimal project, and whether it fails outside the repo
checkout. For VS Code, include Output channel logs; for Zed, language server logs
if available.

## Suggested template

```text
Title: short description

Environment:
- Ori:
- OS:
- Command:

Reproduction:
1. ...
2. ...

Expected:

Actual:

Minimal file:
module app.main

main()
end
```

Start with the smallest file that shows the problem.
