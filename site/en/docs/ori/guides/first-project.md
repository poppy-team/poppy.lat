---
title: "First project and local packages"
description: "How to create a project, declare local packages, and compile a first program."
project: ori
category: guides
locale: en
sourcePath: "docs/guides/first-project.md"
sourceBlob: "541f14bd446fee2df6c2bcc525a44b8f3550365d"
revision: "42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f"
license: "MIT"
---
::: info Static copy
Copied from `docs/guides/first-project.md` in [https://github.com/poppy-team/ori-lang](https://github.com/poppy-team/ori-lang) (MIT).
Pinned to revision `42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f`, blob `541f14bd446fee2df6c2bcc525a44b8f3550365d`.
The upstream repository stays canonical; this copy is not updated automatically.
:::
# First project and local packages

> Status: practical guide for Ori **S3 + inference B / workspace 0.3.8-dev**
> **Portuguese:** [first-project.pt-BR.md](https://github.com/poppy-team/ori-lang/blob/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/docs/guides/first-project.pt-BR.md))  
> Layout: root-first (`ori.proj` + `main.orl`) — see [spec/17](https://github.com/poppy-team/ori-lang/blob/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/docs/spec/17-project-and-docs.md))
## Create a project

```bash
ori new demo
cd demo
ori check main.orl
ori run main.orl
```

`ori new` creates:

```text
demo/
  ori.proj    # entry = "main.orl"
  main.orl
```

There is **no** required `src/` folder. Optional `docs/` for `.oridoc` sidecars
(see `ori.proj` `[docs]` section). Put more modules in domain folders if you
want (`board/`, `api/`, …).

## Main CLI commands

```bash
ori check main.orl
ori run main.orl
ori compile main.orl --out demo
ori fmt main.orl
ori doctor
ori summary .
```

Tests — mark functions with `@test`:

```ori
module demo.main

import ori.test as test

@test
math_is_stable()
    test.assert(1 + 1 == 2, "math should work")
end
```

```bash
ori test main.orl
```

## Local library dependency

```text
workspace/
  app/
    ori.proj
    ori.pkg.toml
    main.orl
  math/
    ori.pkg.toml
    lib.orl
```

`math/ori.pkg.toml`:

```toml
[package]
name = "demo.math"
version = "0.1.0"
entry = "lib.orl"
ori_version = "0.3.8"
```

`math/lib.orl`:

```ori
module demo.math

public double(value: int) -> int
    return value * 2
end
```

`app/ori.proj`:

```ini
manifest = 1
name = "demo.app"
version = "0.1.0"
kind = "app"
entry = "main.orl"

[source]
root_namespace = "demo.app"

[dependencies]
demo.math = { path = "../math", version = "0.1.0" }
```

`app/main.orl`:

```ori
module demo.app

import demo.math (double)
import ori.io as io

main()
    io.println(string(double(21)))
end
```

```bash
cd workspace/app
ori check main.orl
ori run main.orl
```

## Install into the local package cache

```bash
ori install demo.app --path .
# cache: ~/.ori/packages/<name>/<version>/
ORI_PACKAGE_CACHE=./cache ori install demo.app --path .
```

The local installer validates manifests, copies files, does not execute package
code, and rejects symlinks during copy.

Registry (optional, local or HTTP via `ORI_REGISTRY`):

```bash
ori publish . --registry /path/to/registry
ori install other.pkg@0.1.0
```

See [registry-v1.md](https://github.com/poppy-team/ori-lang/blob/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/docs/planning/registry-v1.md)) for layout (planning; not a
marketplace product push).

## After upgrading Ori

1. Read [CHANGELOG.md](https://github.com/poppy-team/ori-lang/blob/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/CHANGELOG.md)).
2. Run `ori check` / `ori test` on your project.
3. If you still have pre-S3 sources: `ori migrate-syntax .`

---

Next: [Cookbook](https://github.com/poppy-team/ori-lang/blob/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/docs/guides/cookbook.md)) · [Language tour](https://github.com/poppy-team/ori-lang/blob/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/docs/language/tour.md)) ·
[Install](https://github.com/poppy-team/ori-lang/blob/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/docs/install.md)) · [Examples](https://github.com/poppy-team/ori-lang/blob/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/examples/))