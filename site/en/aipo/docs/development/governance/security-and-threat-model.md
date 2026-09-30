---
title: "Security And Threat Model"
description: "Aipo — Security And Threat Model"
project: aipo
category: development
locale: en
sourcePath: "docs/en/governance/security-and-threat-model.md"
sourceBlob: "244a70c926a8bfe777c020bb14ad74a91fae4da6"
revision: "7d51026653301c3048a41e2cf4026e3429c3a3b9"
license: "MIT"
---
::: info Static copy
Copied from `docs/en/governance/security-and-threat-model.md` in [https://github.com/poppy-team/aipo-lang](https://github.com/poppy-team/aipo-lang) (MIT).
Pinned to revision `7d51026653301c3048a41e2cf4026e3429c3a3b9`, blob `244a70c926a8bfe777c020bb14ad74a91fae4da6`.
The source repository remains canonical; this copy is refreshed through a sync pull request, not live.
:::
# Security & Sandboxing

Aipo security architecture is anchored in the principle of **least privilege** and proactive runtime vulnerability mitigation.

---

## Security Principles

1. **Zero Hardcoded Secrets**: Source code, test fixtures, and package manifests never store credentials, API keys, or access tokens.
2. **Deny by Default**: No host system capability (filesystem, environment variables, system clock, network sockets) is accessible to scripts without explicit permission granted by the host application.
3. **Memory Isolation Against Use-After-Free**: Host resources exposed to Aipo scripts utilize generational handles with atomic slot retirement.
4. **Denial of Service (DoS) Hardening**:
   - Maximum recursion depth ceiling in the parser (256 levels) preventing call stack exhaustion.
   - Optional instruction step budgeting (*gas budget*) preventing infinite execution loops in untrusted scripts.
   - Varint LEB128 maximum byte length limits mitigating integer overflow attacks.
5. **Supply Chain Hermeticity**:
   - Remote package dependencies require explicit 40-character commit SHAs in `aipo.toml`.
   - Automatic cryptographic verification against SHA-256 tree digests stored in local cache.
   - Production builds execute 100% offline, eliminating dynamic runtime dependency poisoning.
