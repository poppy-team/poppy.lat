---
title: "Wave 5 Packages"
description: "Aipo — Wave 5 Packages"
project: aipo
category: guides
locale: en
sourcePath: "docs/en/trajectory/wave-5-packages.md"
sourceBlob: "3a882d8a6fcfcaa8c55879ae91291bdadc9d982f"
revision: "7d51026653301c3048a41e2cf4026e3429c3a3b9"
license: "MIT"
---
::: info Static copy
Copied from `docs/en/trajectory/wave-5-packages.md` in [https://github.com/poppy-team/aipo-lang](https://github.com/poppy-team/aipo-lang) (MIT).
Pinned to revision `7d51026653301c3048a41e2cf4026e3429c3a3b9`, blob `3a882d8a6fcfcaa8c55879ae91291bdadc9d982f`.
The source repository remains canonical; this copy is refreshed through a sync pull request, not live.
:::
# Wave 5 — Hermetic & Offline Package Manager

**Wave 5** built the packaging, dependency resolution, and distribution system for the Aipo programming language (P04-G01 to P04-G11), designed around **hermeticity, determinism, and supply chain security**.

---

## Achieved Milestones

### 1. Package System Foundation (P04-G01)
- Formal package identification based on `namespace.package` coordinates.
- Canonical `aipo.toml` manifest specification and deterministic `aipo.lock` lockfile generation.
- Local path dependency resolution (`path`), qualified imports, and immutable provenance tracking.

### 2. GitHub Remote Dependencies Pinned by SHA (P04-G04 to P04-G06)
- Support for GitHub-hosted dependencies, strictly requiring a **pinned commit SHA** in the manifest:
  ```toml
  [dependencies]
  helper = { github = "organization/repo", commit = "4b24a71c08" }
  ```
- Recursive dependency graph resolution enforcing a hard security cap of 256 packages per project.
- Atomic downloads orchestrated exclusively via the dedicated `aipo package fetch-github` command, supporting opt-in Bearer token authentication without ever leaking or logging secrets.

### 3. Offline Consumption & Cryptographic Integrity (P04-G07 to P04-G10)
- Local content-addressable cache (`.aipo/cache`) verified against SHA-256 tree digests.
- Standard execution workflows (`run`, `check`, `build`) run in strictly **offline mode**:
  - The runtime never issues network requests during ordinary execution.
  - Missing or tampered package archives immediately cause a secure *fail-closed* termination.
- Cache auditing and maintenance tooling:
  - `aipo package cache verify`: Scans and asserts cryptographic validity across all cached dependencies.
  - `aipo package cache prune`: Safely prunes orphaned package versions no longer referenced in the active lockfile.
