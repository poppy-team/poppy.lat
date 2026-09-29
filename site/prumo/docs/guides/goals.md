---
title: "Goals"
description: "Objetivos verificáveis e o ciclo de estados de um Goal."
project: prumo
category: guides
locale: pt-BR
sourcePath: "docs/user-guide/goals.md"
sourceBlob: "a7c329caf1fd40df896163ce8d11be6e6406e0a5"
revision: "0f643d1c4fa8ac789cee878fbcd035f214f4eb4a"
license: "MIT"
---
::: info Static copy
Copied from `docs/user-guide/goals.md` in [https://github.com/poppy-team/prumo](https://github.com/poppy-team/prumo) (MIT).
Pinned to revision `0f643d1c4fa8ac789cee878fbcd035f214f4eb4a`, blob `a7c329caf1fd40df896163ce8d11be6e6406e0a5`.
The upstream repository stays canonical; this copy is not updated automatically.
:::
# Goal System v2

Goals represent outcome-based milestones.

## Goal Lifecycle
1. `DRAFT`: Initial drafting of objective, constraints, and acceptance criteria.
2. `PLANNED`: Reviewed and mapped into task dependencies.
3. `LOCKED`: Acceptance criteria are cryptographically locked via SHA256 digest.
4. `EXECUTING`: Tasks running under active Plan.
5. `VERIFYING`: Evidence being collected and verified against gates.
6. `REVIEWING`: Cross-provider review of changes.
7. `DONE`: All acceptance criteria verified by recorded evidence.

## Goal Amendments
Once `LOCKED`, criteria cannot be silently edited. Changes require formal amendments:
```bash
prumo-agent goal amend P01-G01 --file amendment.json
```
