---
title: "Lpc"
description: "Prumo — Lpc"
project: prumo
category: development
locale: en
sourcePath: "docs/en/governance/lpc.md"
sourceBlob: "66fe47b0fc357ec3dbfe628347799969c3fdda6f"
revision: "e91694d3959be1ed92757b34063efe0b2191821f"
license: "MIT"
---
::: info Static copy
Copied from `docs/en/governance/lpc.md` in [https://github.com/poppy-team/prumo](https://github.com/poppy-team/prumo) (MIT).
Pinned to revision `e91694d3959be1ed92757b34063efe0b2191821f`, blob `66fe47b0fc357ec3dbfe628347799969c3fdda6f`.
The source repository remains canonical; this copy is refreshed through a sync pull request, not live.
:::
# Lean Progressive Context (LPC)

The **Lean Progressive Context (LPC)** methodology is one of Prumo's core scientific differentiators. It was conceived to solve the problem of cognitive degradation and hallucination in language models when they are subjected to saturated context windows.

## The Three Core Principles

1. **Smallest Sufficient Context**: The agent must not receive the entire codebase or the whole documentation tree. It should receive only the slice strictly necessary to fulfill the current directive.
2. **Progressive Expansion**: If, during execution, it turns out that an adjacent dependency or contract needs to be understood, the agent uses specific tools to request the expansion of that focal point.
3. **Bounded Output**: The agent must never dump hundreds of lines of logs, memory dumps, or complete output from test suites. ACI tools filter and bound the output before handing it to the LLM.

## Practical Impact

| Metric | Traditional Approach (Megaprompt) | Prumo with LPC |
|---|---|---|
| **Average Token Consumption** | 80k – 200k tokens per turn | 4k – 12k tokens per turn |
| **Hallucination Rate** | High (accumulated noise) | Close to zero (narrow focus) |
| **Cost per Session** | High ($$$) | Up to 85% lower ($) |
| **Response Time (TTFT)** | Slow (high prompt latency) | Ultra-fast |
