---
title: "Wave 1 Contracts"
description: "Aipo — Wave 1 Contracts"
project: aipo
category: guides
locale: en
sourcePath: "docs/en/trajectory/wave-1-contracts.md"
sourceBlob: "ba0fe72f95adf12941edb20a26399f5cb2402814"
revision: "21ad042c30a8e684be68da712ceb9e56eb9c7774"
license: "MIT"
---
::: info Static copy
Copied from `docs/en/trajectory/wave-1-contracts.md` in [https://github.com/poppy-team/aipo-lang](https://github.com/poppy-team/aipo-lang) (MIT).
Pinned to revision `21ad042c30a8e684be68da712ceb9e56eb9c7774`, blob `ba0fe72f95adf12941edb20a26399f5cb2402814`.
The source repository remains canonical; this copy is refreshed through a sync pull request, not live.
:::
# Wave 1 — Contracts, Rollback & Conformance

**Wave 1** elevated Aipo beyond conventional interpreters by introducing its defining architectural paradigm: **structural data guarantees through signature contracts, atomic rollback invariants, and formal interfaces**.

---

## Achieved Milestones

### 1. Construction Hooks and Invariants (`init` and `invariant`)
- Addition of the `init()` hook ensures that newly instantiated structures undergo validation and normalization before exposure to consumer code.
- The `invariant()` block was integrated into stable mutation boundaries. Whenever a struct field is mutated, the runtime rigorously validates declared logical assertions.

### 2. Transactional Rollback with `attempt ... recover`
- Implementation of an in-memory **mutation journal** inside the virtual machine:
  - Entering an `attempt` block initiates recording of all subsequent object mutations into a rollback journal.
  - If an operational failure (`fail`) occurs or an `invariant()` assertion is violated, the journal atomically reverts all modified structs to their pre-attempt state before transferring execution to the `recover` block.
  - Upon successful block completion, the journal is committed and discarded without lingering memory overhead.

### 3. Static and Runtime Interface Validation
- Support for formal interfaces and structural conformance:
  - Semantic analysis pre-validates method names, parameter arities, and `self` receiver compatibility.
  - At runtime, calls dispatched through interfaces perform structural validation, yielding deterministic faults if an incompatible object is provided.

### 4. Full Support for Local Functions & Module Scopes
- Lexical scope resolution completed with nested local functions and self-referential recursion support via the `FillSelfCapture` bytecode instruction.
- Transparent and safe access to module-level bindings from `impl` methods and closures.

### 5. 100% Green Conformance Gauntlet
- Certified by 20 canonical programs and 19 diagnostic test suites, achieving 100% compliance across all quality gates (fmt, clippy, check, test, doc).
