---
title: "Js Emitter"
description: "Aipo — Js Emitter"
project: aipo
category: development
locale: en
sourcePath: "docs/en/architecture/js-emitter.md"
sourceBlob: "dd9fe3f590d05731f4c5ad714c3268aae61cfd10"
revision: "21ad042c30a8e684be68da712ceb9e56eb9c7774"
license: "MIT"
---
::: info Static copy
Copied from `docs/en/architecture/js-emitter.md` in [https://github.com/poppy-team/aipo-lang](https://github.com/poppy-team/aipo-lang) (MIT).
Pinned to revision `21ad042c30a8e684be68da712ceb9e56eb9c7774`, blob `dd9fe3f590d05731f4c5ad714c3268aae61cfd10`.
The source repository remains canonical; this copy is refreshed through a sync pull request, not live.
:::
# JavaScript Backend (`aipo-js`)

The Aipo JavaScript backend transpiles Aipo source code directly to **modern JavaScript (ES2022)** with 100% behavioral parity guarantees.

---

## The Parity Challenge

Many language transpilers targeting JavaScript succumb to loose JS primitive coercion, causing subtle runtime inconsistencies (such as `0 == ""` or `"5" + 2 == "52"`).

`aipo-js` follows a strict strategy:
1. **Versioned Runtime Shim**: A lightweight pure JavaScript helper library implementing classes and functions that maintain Aipo's strict type semantics, transactional mutation journals, ordered sets/maps, and binary byte manipulation.
2. **Clean JS Emission**: Lowers control flow constructs to native JS equivalents (functions, classes, `try/catch` wrapping `attempt` rollbacks), maintaining high V8 and JavaScriptCore optimization tiers.
3. **Source Maps V3**: Automatically emits Source Maps V3, enabling native browser devtools and Node.js stack traces to point directly back to the original `.aipo` source code.

---

## Differential Conformance Verification

To guarantee that the JavaScript compiler never drifts from the native Rust virtual machine, the project runs continuous differential tests:
- Every program in the conformance test suite is executed on both the native Rust VM and Node.js.
- Any single-character deviation in `stdout` or mismatched diagnostic code fails the build gate immediately.
