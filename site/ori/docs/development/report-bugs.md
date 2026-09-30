---
title: "Como reportar bugs"
description: "O que incluir num relato de bug para que ele possa ser reproduzido."
project: ori
category: development
locale: pt-BR
sourcePath: "docs/guides/report-bugs.pt-BR.md"
sourceBlob: "5dab081bda91830eb7eb10f363466f3508762519"
revision: "42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f"
license: "MIT"
---
::: info Cópia estática
Copiado de `docs/guides/report-bugs.pt-BR.md` em [https://github.com/poppy-team/ori-lang](https://github.com/poppy-team/ori-lang) (MIT).
Fixado na revisão `42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f`, blob `5dab081bda91830eb7eb10f363466f3508762519`.
O repositório de origem permanece canônico; esta cópia não é atualizada automaticamente.
:::
# Como reportar bugs

> Status: política prática Ori **S3 + inferência B / workspace 0.3.8-dev**
> **English:** [report-bugs.md](/en/ori/docs/development/report-bugs)

Um bom report permite reproduzir o problema com poucos comandos.

## Linguagem / type checker

Inclua: `ori --version`, SO, arquivo `.orl` mínimo, comando
(`ori check main.orl`), saída completa do diagnóstico.

## Stdlib / runtime

Inclua módulo (`ori.fs`, …), se falha em `ori run` e/ou `ori compile`, e
`ORI_TEST_LEAK_CHECK=1` quando for memória.

## Tooling

`ori fmt`, `ori doc`, LSP, VS Code / Zed, package de release. Comando exato e
projeto mínimo.
## Formato sugerido

```text
Título: descrição curta

Ambiente:
- Ori:
- OS:
- Comando:

Reprodução:
1. ...

Esperado:

Obtido:

Arquivo mínimo:
module app.main

main()
end
```

Não envie projetos grandes no primeiro relato.
