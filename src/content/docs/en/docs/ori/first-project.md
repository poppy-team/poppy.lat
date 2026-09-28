---
title: First project and local packages
description: Create an Ori project, run its first program, and learn the main commands.
sidebar:
  order: 2
---

> Source: [`docs/guides/first-project.md`](https://github.com/poppy-team/ori-lang/blob/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/docs/guides/first-project.md) · revision `42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f` · blob `541f14bd446fee2df6c2bcc525a44b8f3550365d` · MIT license.
>
> This is a static reading copy. Ori and its full documentation remain canonical in the source repository.

**Português:** [Primeiro projeto e pacotes locais](/docs/ori/first-project/)

> Status: practical guide for Ori **S3 + inference B / workspace 0.3.8-dev**. Root-first layout (`ori.proj` + `main.orl`); see [spec 17 in the canonical repository](https://github.com/poppy-team/ori-lang/blob/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/docs/spec/17-project-and-docs.md).

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

There is **no** required `src/` folder. `docs/` is optional for `.oridoc` sidecars. Put more modules in domain folders if you want (`board/`, `api/`, …).

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

The local installer validates manifests, copies files, does not execute package code, and rejects symlinks during copy.

An optional registry can be local or HTTP through `ORI_REGISTRY`:

```bash
ori publish . --registry /path/to/registry
ori install other.pkg@0.1.0
```

See the [canonical registry planning document](https://github.com/poppy-team/ori-lang/blob/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/docs/planning/registry-v1.md); this is not a marketplace product push.

## After upgrading Ori

1. Read the [canonical changelog](https://github.com/poppy-team/ori-lang/blob/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/CHANGELOG.md).
2. Run `ori check` and `ori test`.
3. For pre-S3 syntax, use `ori migrate-syntax .`.

Next: [Cookbook](https://github.com/poppy-team/ori-lang/blob/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/docs/guides/cookbook.md) · [Language tour](https://github.com/poppy-team/ori-lang/blob/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/docs/language/tour.md) · [Install](https://github.com/poppy-team/ori-lang/blob/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/docs/install.md) · [Examples](https://github.com/poppy-team/ori-lang/tree/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/examples/)
