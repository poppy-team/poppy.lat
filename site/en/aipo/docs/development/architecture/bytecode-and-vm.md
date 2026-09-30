---
title: "Bytecode And Vm"
description: "Aipo — Bytecode And Vm"
project: aipo
category: development
locale: en
sourcePath: "docs/en/architecture/bytecode-and-vm.md"
sourceBlob: "6c6c5de8b91116f335617993bc0371f786a6d4c7"
revision: "d9f9557e04871546a92b7ca1fcbc7e6f116803f8"
license: "MIT"
---
::: info Static copy
Copied from `docs/en/architecture/bytecode-and-vm.md` in [https://github.com/poppy-team/aipo-lang](https://github.com/poppy-team/aipo-lang) (MIT).
Pinned to revision `d9f9557e04871546a92b7ca1fcbc7e6f116803f8`, blob `6c6c5de8b91116f335617993bc0371f786a6d4c7`.
The source repository remains canonical; this copy is refreshed through a sync pull request, not live.
:::
# Bytecode & Virtual Machine

Aipo executes natively on a **deterministic bytecode virtual machine**, optimized for low memory footprint and high-throughput instruction dispatch.

---

## The `.aibc` Binary Format

The Aipo compiler can serialize bytecode chunks directly into an `.aibc` binary archive:

- **Magic Header**: 4-byte signature `AIBC` followed by format version integer (currently `1`).
- **Constant Pool**: Integer literals, floating-point numbers, normalized strings, and function prototypes.
- **Debug Metadata Table**: Bytecode instruction offsets mapped to source code lines and columns.
- **Code Section**: Compact binary encoding of virtual machine instructions.

---

## Virtual Machine Architecture (`aipo-vm`)

### 1. Value Representation (`Value`)
The core `Value` enum is compact (48 bytes) with heap variants reference-counted via `Rc`:
- Primitives: `Int(i64)`, `Float(f64)`, `Bool(bool)`, `None`
- Reference-counted heap variants: `String(Rc<str>)`, `List(Rc<RefCell<Vec<Value>>>)`, `Dict`, `Set`, `Bytes`
- Execution entities: `Closure`, `BoundMethod`, `TaskHandle`, `HostHandle`

### 2. Dispatch Loop Optimization
- Instructions are decoded directly via flattened `match` branches, eliminating bulky 72-byte `Result` allocations on every CPU cycle.
- Inline monomorphic caches for struct field resolution, accelerating property lookups by up to 28%.
- Formal bytecode verifier asserting local slot bounds, upvalues, and frame depth limits prior to execution.

### 3. Integrated Disassembler
The `aipo disasm` command disassembles bytecode instructions and maps each mnemonic directly to its originating source line, streamlining profiling, debugging, and security audits.
