---
title: "CONTRIBUTING"
description: "Prumo — CONTRIBUTING"
project: prumo
category: development
locale: en
sourcePath: "docs/en/CONTRIBUTING.md"
sourceBlob: "1ce697eb5c0fbd0aee3ea807a7db2ca02a7ec4c2"
revision: "e91694d3959be1ed92757b34063efe0b2191821f"
license: "MIT"
---
::: info Static copy
Copied from `docs/en/CONTRIBUTING.md` in [https://github.com/poppy-team/prumo](https://github.com/poppy-team/prumo) (MIT).
Pinned to revision `e91694d3959be1ed92757b34063efe0b2191821f`, blob `1ce697eb5c0fbd0aee3ea807a7db2ca02a7ec4c2`.
The source repository remains canonical; this copy is refreshed through a sync pull request, not live.
:::
# Contributing and Framework Evolution

Prumo should learn from real projects without becoming a dumping ground for project-specific instructions.

A reusable change should identify:

- recurring problem;
- evidence;
- generic rule;
- affected protocol/schemas/catalog/adapters;
- compatibility/migration impact;
- token/cost/maintenance impact when context behavior changes.

## Checklist

- Keep core provider-neutral.
- Keep `ENTRYPOINT.md` and root `AGENTS.md` short.
- Maintain Markdown + JSON as the human-maintained format budget.
- A new persistent format requires ADR-level justification.
- Keep runtime/cache/derived data out of canonical Git state.
- Update schemas when contracts change.
- Add tests for behavior/migration changes.
- Do not bake current model rankings into role definitions.
- Prefer capabilities/risk selectors over technology duplication.
- Prefer semantic virtual chunks over documentation microfiles.
- Context changes need a token/quality benchmark and stopping rule.
- Deep recursion stays experimental unless evidence justifies promotion.
