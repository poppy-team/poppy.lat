---
title: "Prumo And Lpc"
description: "Aipo — Prumo And Lpc"
project: aipo
category: development
locale: en
sourcePath: "docs/en/governance/prumo-and-lpc.md"
sourceBlob: "3f8f2ea86b2142fa6bb254ba28c6ad2c37b530c9"
revision: "d9f9557e04871546a92b7ca1fcbc7e6f116803f8"
license: "MIT"
---
::: info Static copy
Copied from `docs/en/governance/prumo-and-lpc.md` in [https://github.com/poppy-team/aipo-lang](https://github.com/poppy-team/aipo-lang) (MIT).
Pinned to revision `d9f9557e04871546a92b7ca1fcbc7e6f116803f8`, blob `3f8f2ea86b2142fa6bb254ba28c6ad2c37b530c9`.
The source repository remains canonical; this copy is refreshed through a sync pull request, not live.
:::
# Prumo CLI & LPC Methodology

Aipo utilizes **Prumo v0.6** as its continuous governance framework alongside the **Lean Progressive Context (LPC)** methodology to orchestrate precision collaboration between human developers and autonomous AI agents.

---

## The Lean Progressive Context (LPC) Paradigm

1. **Smallest Sufficient Context**: Every engineering task begins with the minimal subset of required context files, preventing context dilution and hallucinated assumptions.
2. **Pointer over Payload**: Heavy payloads are indexed via authority maps (`AUTHORITY_MAP.json`), stable interface contracts, and canonical file pointers rather than ingesting entire directory trees.
3. **Bounded Progressive Expansion**: Context is expanded only when active evidence is insufficient to prove acceptance criteria.
4. **Never Weaken Criteria Silently**: When a technical gate encounters unforeseen barriers, the discrepancy is escalated as an explicit Architectural Decision Proposal (ADP) rather than conceded through silent shortcuts.

---

## Prumo as a Lifecycle Automation Tool

The `prumo` command-line utility enforces:
- **Quality Gates**: Deterministic documentation verification (`prumo docs audit`, `prumo docs verify --strict`).
- **Evidence Traceability**: Mapping architectural decisions, generated artifacts, and execution histories under `.prumo/history/`.
- **Documentation Drift Prevention**: Enforced synchronization between canonical specifications, automated test suites, and production implementations in every single change (*Documentation Delta*).
