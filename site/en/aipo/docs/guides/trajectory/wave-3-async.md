---
title: "Wave 3 Async"
description: "Aipo — Wave 3 Async"
project: aipo
category: guides
locale: en
sourcePath: "docs/en/trajectory/wave-3-async.md"
sourceBlob: "314e4626b39cb33f3a5b082294c55b412024a096"
revision: "d9f9557e04871546a92b7ca1fcbc7e6f116803f8"
license: "MIT"
---
::: info Static copy
Copied from `docs/en/trajectory/wave-3-async.md` in [https://github.com/poppy-team/aipo-lang](https://github.com/poppy-team/aipo-lang) (MIT).
Pinned to revision `d9f9557e04871546a92b7ca1fcbc7e6f116803f8`, blob `314e4626b39cb33f3a5b082294c55b412024a096`.
The source repository remains canonical; this copy is refreshed through a sync pull request, not live.
:::
# Wave 3 — Rich Types, Async & Concurrency

**Wave 3** introduced modern structural data types and consolidated Aipo's **deterministic, cooperative asynchronous concurrency infrastructure**.

---

## Achieved Milestones

### 1. Rich Types and Value Semantics
- **`Set`**: Collection of unique values maintaining strict insertion order.
- **`Sequence`**: Lazy evaluation pipelines enabling composable data transformations without intermediate allocations.
- **`Bytes` Packing**: Direct binary reading and writing methods (`read_u16_le`, `write_u32_be`, etc.), optimized for binary protocols and high-throughput I/O.
- **`Duration`**: Native type for high-precision time intervals.

### 2. Asynchronous Syntax & Semantics
- Functions declared with `async fn` return cooperative task handles.
- Sequential `await do ... end` block prevents scattered `await` expressions across nested operations, eliminating subtle interleaving race conditions.
- Static semantic diagnostics:
  - `AIPO_SEM_AWAIT_IN_SUBEXPRESSION`: Disallows unanchored `await` outside dedicated blocks.
  - `AIPO_SEM_FORGOTTEN_TASK`: Flags unawaited, detached task handles.
  - `AIPO_SEM_NESTED_AWAIT_DO`: Forbids confusing nested await blocks.

### 3. Cooperative Scheduler with Virtual Time
- Deterministic runtime task scheduler:
  - Tasks yield execution cooperatively at explicit suspension boundaries (`task.sleep`, `await`).
  - Runtime execution does not depend on host wall-clock time, but on a **deterministic virtual clock**, enabling tests with multiple timeouts to execute in milliseconds with zero test flakiness.

### 4. Async Combinators & Cycle Detection
- Full `task` standard library: `task.spawn`, `task.sleep`, `task.all`, `task.race`, `task.timeout`, `task.cancel`, `task.group`.
- Runtime cycle detection across transitive task await chains (`AIPO_RT_AWAIT_CYCLE`), preventing silent task deadlocks.
