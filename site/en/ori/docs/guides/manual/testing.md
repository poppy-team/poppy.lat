---
title: "Testing"
description: "How to test Ori programs with @test and ori test, and how to test the compiler."
project: ori
category: guides
locale: en
sourcePath: "docs/guides/testing.md"
sourceBlob: "2c9ba86c2efae69496088e9b4443383b13808e38"
revision: "42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f"
license: "MIT"
---
::: info Static copy
Copied from `docs/guides/testing.md` in [https://github.com/poppy-team/ori-lang](https://github.com/poppy-team/ori-lang) (MIT).
Pinned to revision `42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f`, blob `2c9ba86c2efae69496088e9b4443383b13808e38`.
The source repository remains canonical; this copy is refreshed through a sync pull request, not live.
:::
# Testing Ori (user + contributor)

> **Portuguese (maintainer-oriented manual):** [testing.pt-BR.md](/ori/docs/guides/manual/testing)  
> **Surface:** S3 / workspace under `compiler/`

## As an Ori user

Mark tests with `@test` and run:

```ori
module app.main

import ori.test as test

@test
adds()
    test.assert(1 + 1 == 2, "add")
end

main()
end
```

```bash
ori test main.orl
ori test main.orl --filter adds
```

Async tests are supported when the function is `async` and uses `await`
(native backend). Put `@test` on the line before the function, then add the
`async` modifier to the function declaration:

```ori
module app.async_tests

imports
    ori.task = task
    ori.test = test
end

@test
async async_check()
    await task.sleep(1)
    test.assert(true, "async test should run")
end
```

See `compiler/crates/ori-driver/tests/concurrency_async.rs` for compiler-side
coverage.

Optional leak check:

```bash
ORI_TEST_LEAK_CHECK=1 ori test main.orl
```

## As a compiler contributor

Codegen coverage targets native AOT/JIT, linking, generated C FFI headers, and
runtime symbols. Validate AOT/JIT parity on their shared support surface;
C/FFI host sanitizers remain distinct from instrumenting generated native code.

From the repository root:

```bash
cd compiler
cargo check --workspace
cargo test --workspace
cargo test -p ori-driver --test multifile_imports
cargo test -p ori-driver --test diagnostic_catalog
```

Release-style package smoke (needs system linker):

```bash
sh tools/smoke_native_release.sh
sh tools/smoke_no_rust.sh --package-root … --allow-rust-on-path
```

See root [AGENTS.md](https://github.com/poppy-team/ori-lang/blob/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/AGENTS.md) for staging the native runtime and env vars.

Editor DX smokes (local only):

```bash
./tools/smoke_vscode_extension.sh
# Zed: install extensions/zed-ori as a dev extension (see its README)
```
