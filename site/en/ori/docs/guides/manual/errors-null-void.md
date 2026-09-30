---
title: "Errors, optional, and void"
description: "The mental model of absence and failure: optional, result, try, and void."
project: ori
category: guides
locale: en
sourcePath: "docs/guides/errors-null-void.md"
sourceBlob: "f729d2e9d568f384f5e0c5d5e20ff1bb4ef8b532"
revision: "42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f"
license: "MIT"
---
::: info Static copy
Copied from `docs/guides/errors-null-void.md` in [https://github.com/poppy-team/ori-lang](https://github.com/poppy-team/ori-lang) (MIT).
Pinned to revision `42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f`, blob `f729d2e9d568f384f5e0c5d5e20ff1bb4ef8b532`.
The source repository remains canonical; this copy is refreshed through a sync pull request, not live.
:::
# Errors, optional, void — mental model

> Pedagogical guide (surface **S3 + inference B / workspace 0.3.8-dev**).
> **Portuguese:** [errors-null-void.pt-BR.md](/ori/docs/guides/manual/errors-null-void)  
> Normative: [09-errors](https://github.com/poppy-team/ori-lang/blob/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/docs/spec/09-errors.md), [04-types](https://github.com/poppy-team/ori-lang/blob/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/docs/spec/04-types.md)

## Four concepts

| Concept | Role | When |
|---------|------|------|
| **`void`** | No useful return | Side-effect functions |
| **`optional[T]`** | Value may be absent | Lookup, EOF — absence is not failure |
| **`result[T, E]`** | Success or failure with reason | I/O, validation |
| **`check`** | Runtime precondition | Invariants |

Ori has **no null**. Use `none` or `err(...)`.

## `void`

```ori
module app.main

import ori.io as io

greet() -> void
    io.println("hello")
end

main()
    greet()
end
```

## `optional[T]`

```ori
module app.main

find_user(id: int) -> optional[string]
    if id == 0
        return none
    end
    return some("alice")
end

main()
    match find_user(1)
        case some(name):
            -- use name
        case none:
    end
end
```

- Unpack with `if some(x) = expr` or `match`.
- `try` on optional propagates `none`.
- Postfix `?` was **removed** in S3.

## `result[T, E]`

```ori
module app.main

import ori.fs as fs

read_config(path: string) -> result[string, string]
    return fs.read_text(path)
end
```

- Build with **`ok(value)`** / **`err(reason)`** (not `success` / `error`).
- Handle with `match` or **`try expr`**.

## `check`

```ori
divide(a: int, b: int) -> int
    check b != 0, "division by zero"
    return a / b
end
```

Fails the process on broken contracts; it is not a `result`.

## Quick map

| Situation | Use |
|-----------|-----|
| Print only | `-> void` |
| “Not found”, not an error | `optional[T]` |
| Failure with message | `result[T, string]` |
| Must always be true | `check` |

```bash
ori explain name.undefined
ori doctor
```

Catalog: [13-error-catalog.md](https://github.com/poppy-team/ori-lang/blob/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/docs/spec/13-error-catalog.md).
