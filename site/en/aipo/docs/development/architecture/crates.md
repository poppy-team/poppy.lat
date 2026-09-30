---
title: "Crates"
description: "Aipo — Crates"
project: aipo
category: development
locale: en
sourcePath: "docs/en/architecture/crates.md"
sourceBlob: "e1330d7669cd3c1a8744dc44d89511badb142d9d"
revision: "d9f9557e04871546a92b7ca1fcbc7e6f116803f8"
license: "MIT"
---
::: info Static copy
Copied from `docs/en/architecture/crates.md` in [https://github.com/poppy-team/aipo-lang](https://github.com/poppy-team/aipo-lang) (MIT).
Pinned to revision `d9f9557e04871546a92b7ca1fcbc7e6f116803f8`, blob `e1330d7669cd3c1a8744dc44d89511badb142d9d`.
The source repository remains canonical; this copy is refreshed through a sync pull request, not live.
:::
# Workspace Crate Contracts

The Aipo codebase is structured as a collection of **modular Rust crates**, each enforcing strict domain boundaries and acyclic dependency graphs.

---

## Crate Inventory

| Crate | Primary Domain | Internal Dependencies |
| :--- | :--- | :--- |
| **`aipo-source`** | Source file representation & UTF-8 safe boundary indexing | None |
| **`aipo-diagnostics`** | Stable diagnostic catalog, source spans & formatting | `aipo-source` |
| **`aipo-lexer`** | Zero-copy UTF-8 tokenizer & lexical validations | `aipo-source`, `aipo-diagnostics` |
| **`aipo-ast`** | Abstract Syntax Tree node definitions | `aipo-source`, `aipo-diagnostics` |
| **`aipo-syntax`** | Recursive-descent parser with error synchronization | `aipo-lexer`, `aipo-ast`, `aipo-diagnostics` |
| **`aipo-hir`** | High-level Intermediate Representation lowering | `aipo-ast`, `aipo-diagnostics` |
| **`aipo-sema`** | Semantic validation & structural contract checks | `aipo-hir`, `aipo-diagnostics` |
| **`aipo-ir`** | Linearized Core Intermediate Representation | `aipo-hir`, `aipo-diagnostics` |
| **`aipo-bytecode`** | Instruction encoding & `.aibc` binary serialization | `aipo-ir`, `aipo-diagnostics` |
| **`aipo-vm`** | Bytecode virtual machine & cooperative async scheduler | `aipo-bytecode`, `aipo-diagnostics` |
| **`aipo-js`** | JavaScript ES2022 emitter & Source Maps V3 | `aipo-hir`, `aipo-diagnostics` |
| **`aipo-host`** | Sandboxed Host ABI, capabilities & generational handles | `aipo-diagnostics` |
| **`aipo-runtime`** | Host runtime registration & native module management | `aipo-vm`, `aipo-host` |
| **`aipo-stdlib`** | Canonical standard library modules | `aipo-runtime`, `aipo-vm` |
| **`aipo-poppy`** | Headless ECS simulation adapter | `aipo-host`, `aipo-vm` |
| **`aipo-formatter`** | Automatic source code formatting | `aipo-syntax`, `aipo-ast` |
| **`aipo-cli`** | Unified CLI entrypoint (`aipo`) | All crates above |
