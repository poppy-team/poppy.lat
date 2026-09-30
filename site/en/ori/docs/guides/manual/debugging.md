---
title: "Debugging"
description: "The terminal debugger, the DAP server, and editor integration."
project: ori
category: guides
locale: en
sourcePath: "docs/guides/debugging.md"
sourceBlob: "5f86c74a893e230f8f10a39eee25c96bb7f2b845"
revision: "42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f"
license: "MIT"
---
::: info Static copy
Copied from `docs/guides/debugging.md` in [https://github.com/poppy-team/ori-lang](https://github.com/poppy-team/ori-lang) (MIT).
Pinned to revision `42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f`, blob `5f86c74a893e230f8f10a39eee25c96bb7f2b845`.
The source repository remains canonical; this copy is refreshed through a sync pull request, not live.
:::
# Debugging Ori programs

> **Audience:** users diagnosing a native program or wiring an IDE
> **Portuguese:** [debugging.pt-BR.md](/ori/docs/guides/manual/debugging)

Ori provides a cooperative native debugger and a small Debug Adapter Protocol
(DAP) server. Both consume the same compiler-generated snapshot data.

## Terminal debugger

```text
ori debug examples/cli_args/main.orl --breakpoint 41
```

At a stop:

| Key | Action |
|---|---|
| `c` | continue |
| `s` | step to the next instrumented line |
| `q` | terminate the target |

The terminal adapter shows the source location, stack (including supported
async frames), and visible locals.

## DAP server

Start the adapter over stdio:

```text
ori debug --dap
```

The current adapter implements `initialize`, `launch`, `setBreakpoints`,
`configurationDone`, `continue`, `next`, `threads`, `stackTrace`, `scopes`,
`variables`, `evaluate`, and `disconnect`.

Variables expose qualified struct fields, optional/result payloads, enum
payloads, maps, sets, supported opaque collections, and bounded list children.
Async frames remain visible across `await`; closure captures appear in their
closure frame. Strings and bytes are shown with bounded previews. `evaluate`
only evaluates scalar arithmetic, comparisons, boolean logic, and strings from
the latest stopped snapshot; it never executes target code.

Native builds also emit `program.debug.json`, a portable catalogue of source
lines, parameters, locals, pattern bindings, and closure captures.

## IDE integration

The VS Code extension registers the `ori` debugger type and starts
`ori debug --dap`. Zed currently exposes LSP integration; automatic debugger
wiring is not available through its extension API.

For linker/runtime diagnosis, run `ori doctor` before changing source code.
