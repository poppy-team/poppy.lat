---
title: "CONTRIBUTING"
description: "Prumo — CONTRIBUTING"
project: prumo
category: development
locale: pt-BR
sourcePath: "docs/CONTRIBUTING.md"
sourceBlob: "1ce697eb5c0fbd0aee3ea807a7db2ca02a7ec4c2"
revision: "0f643d1c4fa8ac789cee878fbcd035f214f4eb4a"
license: "MIT"
---
::: info Cópia estática
Copiado de `docs/CONTRIBUTING.md` em [https://github.com/poppy-team/prumo](https://github.com/poppy-team/prumo) (MIT).
Fixado na revisão `0f643d1c4fa8ac789cee878fbcd035f214f4eb4a`, blob `1ce697eb5c0fbd0aee3ea807a7db2ca02a7ec4c2`.
O repositório de origem permanece canônico; esta cópia é atualizada por um pull request de sincronização, não em tempo real.
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
