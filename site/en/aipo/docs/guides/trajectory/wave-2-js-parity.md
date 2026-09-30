---
title: "Wave 2 Js Parity"
description: "Aipo — Wave 2 Js Parity"
project: aipo
category: guides
locale: en
sourcePath: "docs/en/trajectory/wave-2-js-parity.md"
sourceBlob: "a9bb312e6ec76eb87820017f312695b1fabbb6f2"
revision: "d9f9557e04871546a92b7ca1fcbc7e6f116803f8"
license: "MIT"
---
::: info Static copy
Copied from `docs/en/trajectory/wave-2-js-parity.md` in [https://github.com/poppy-team/aipo-lang](https://github.com/poppy-team/aipo-lang) (MIT).
Pinned to revision `d9f9557e04871546a92b7ca1fcbc7e6f116803f8`, blob `a9bb312e6ec76eb87820017f312695b1fabbb6f2`.
The source repository remains canonical; this copy is refreshed through a sync pull request, not live.
:::
# Wave 2 — JavaScript Backend & Deep Quality

**Wave 2** extended Aipo's deployment surface to modern web browsers and serverless runtimes through the **`aipo-js`** compiler, complemented by an exhaustive quality and supply-chain hardening cycle (*Deep Quality Gauntlet*).

---

## Achieved Milestones

### 1. The `aipo-js` Emitter & Runtime Shim
- Semantic compiler lowering HIR directly to **modern JavaScript (ES2022)**.
- Modular, versioned runtime shim implementing:
  - Identical Aipo value and reference semantics in pure JavaScript.
  - Precise operational fault semantics and mutation rollbacks within `attempt` blocks.
  - Normalized Unicode NFC text equivalence.
  - Source-level debugging accuracy via **Source Maps V3**.

### 2. Differential VM ↔ JS Conformance Suite
- Automated differential test runner:
  - Every canonical program in the test suite is executed concurrently on the **native Rust VM** and in **Node.js** via emitted JavaScript.
  - Strict bit-for-bit assertion of identical `stdout`, exit status codes, and diagnostic error outputs across both backends.

### 3. Deep Quality Gauntlet: Fuzzing & Property-Based Testing
- Fuzz testing integration utilizing **libFuzzer** and `cargo-fuzz` for lexer and parser robustness.
- Invariant property testing using **proptest** validating:
  - Resilient AST parsing and idempotent unparsing.
  - Floating-point arithmetic edge cases, integer overflow boundaries, and rounding guarantees.
  - Canonical path normalization and zero-panic UTF-8 string slicing.

### 4. Supply Chain Security Enforcement (`cargo deny`)
- Automated security policies configured in `deny.toml`:
  - Continual vulnerability database auditing against known advisories (RUSTSEC).
  - Strict license policy enforcement rejecting non-compliant or copyleft dependencies.
  - Zero-duplicate crate enforcement across the entire workspace dependency tree.
