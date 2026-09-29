---
title: "M12 Exit Gate"
description: "Prumo — M12 Exit Gate"
project: prumo
category: development
locale: pt-BR
sourcePath: "docs/governance/m12-exit-gate.md"
sourceBlob: "6ecf5c02914debadb5dd9b46d77a23585e65603f"
revision: "0f643d1c4fa8ac789cee878fbcd035f214f4eb4a"
license: "MIT"
---
::: info Cópia estática
Copiado de `docs/governance/m12-exit-gate.md` em [https://github.com/poppy-team/prumo](https://github.com/poppy-team/prumo) (MIT).
Fixado na revisão `0f643d1c4fa8ac789cee878fbcd035f214f4eb4a`, blob `6ecf5c02914debadb5dd9b46d77a23585e65603f`.
O repositório de origem permanece canônico; esta cópia não é atualizada automaticamente.
:::
# M12 Team / Advanced Runtime — Governance Evaluation & Status

Status: **DEFERRED BY DESIGN (Per v0.4 Architecture & Phases)**

## Governance & Architecture Assessment

### Scope & Specification
Per `docs/development/phases.md:384-390`:
- **Scope**: Shared runtime, leases, concurrency coordination, optional server.
- **Prerequisites**: Dependent on M11, explicitly gated: *"only after real usage validates need — deferred until proven necessary"*.

### Architectural Justification
1. **Lean Progressive Context & Provider-Neutral Core**:
   Prumo prioritizes smallest sufficient context, single-agent deterministic execution, and zero unnecessary daemons or central servers.
2. **Local Repository Autonomy**:
   As documented in `docs/architecture/overview.md` and `docs/runtime/control-plane.md`, Prumo is optimized to run locally within developers' environments and CI/CD pipelines without requiring long-lived daemon processes, centralized leasing servers, or distributed lock managers.
3. **Multi-Agent Coordination via Experience Handoff (M9)**:
   Milestone M9 introduced the zero-transcript `Handoff` protocol, allowing sequential or delegated multi-agent state handoff cleanly via files under `.prumo/experience/` without introducing complex network-distributed locking or server processes.
4. **Conclusion**:
   Per formal repository governance, M12 features remain deferred until real multi-agent team usage in production demonstrates an empirical necessity for a shared daemon or server-mediated concurrency coordination.
