---
title: "M11 Exit Gate"
description: "Prumo — M11 Exit Gate"
project: prumo
category: development
locale: pt-BR
sourcePath: "docs/governance/m11-exit-gate.md"
sourceBlob: "d054e47155f147972d4e5ae16be2281f72c2e628"
revision: "0f643d1c4fa8ac789cee878fbcd035f214f4eb4a"
license: "MIT"
---
::: info Cópia estática
Copiado de `docs/governance/m11-exit-gate.md` em [https://github.com/poppy-team/prumo](https://github.com/poppy-team/prumo) (MIT).
Fixado na revisão `0f643d1c4fa8ac789cee878fbcd035f214f4eb4a`, blob `d054e47155f147972d4e5ae16be2281f72c2e628`.
O repositório de origem permanece canônico; esta cópia é atualizada por um pull request de sincronização, não em tempo real.
:::
# M11 Connector SDK — Exit Gate

Status: **COMPLETE (M11 Exit Gate Passed)**

## Exit gate criteria

Milestone M11 exit gate (per `docs/development/phases.md:380`):
A new connector can be built against the Connector SDK and passes contract tests.

---

### 1. Capability Negotiation Protocol

- Implemented in `internal/connectors/negotiation.go`.
- Evaluates contract capabilities against requested runtime capabilities:
  - Supported: native execution.
  - Degraded: graceful fallbacks (e.g. `pre_tool_block` degrades to advisory post-check `advise`; `session_hooks` degrades to periodic manual checkpointing).
  - Unsupported: incompatible in strict mode; warnings generated in non-strict mode.
- Schema contract: `schemas/connector-negotiation.schema.json`.

---

### 2. Standardized Cleanup Manifests Engine

- Implemented in `internal/connectors/cleanup.go`.
- Unified `SaveCleanup`, `LoadCleanup`, and `ExecuteCleanup`.
- Computes removed vs leftovers, ensuring user modifications and project data are never deleted upon uninstall.

---

### 3. Connector Test Kit (`internal/connectors/testkit`)

- Reusable contract verification suite:
  - `VerifyContract`: checks schema, ID, version, protocol range, capabilities, and enforcement.
  - `VerifyCompilation`: checks compilation outputs and `.prumo-generated.json` ownership marker.
  - `VerifyIdempotentInstall`: checks repeated install convergence and cleanup manifest creation.
  - `VerifySafeUninstall`: checks that user files are preserved and managed artifacts are removed.
  - `VerifyNegotiation`: checks capability negotiation under strict and non-strict conditions.
  - `RunAll`: runs all 5 suites on any connector in one call.

---

### 4. Harness Implementations & Elevations

- **Google Gemini CLI (`internal/connectors/gemini`)**: Full connector for `gemini`, providing `.gemini/config.json`, prompts, subagents, and commands. Passes 100% of testkit.
- **Anthropic Claude Code (`internal/connectors/claudecode`)**: Elevated connector for `claude-code`, managing `CLAUDE.md`, `.claude/` subagents, skills, and settings. Passes 100% of testkit.
- **OpenAI Codex CLI (`internal/connectors/codex`)**: Elevated connector for `codex`, managing `AGENTS.md`, `.codex/` subagents, skills, and configuration. Passes 100% of testkit.
- **OpenCode Native Harness (`internal/connectors/opencode`)**: Complete native harness with TS plugin, tool guards, and session hooks. Passes 100% of testkit.

---

### 5. CLI Integration & Verification

- `prumo-agent connector list`: lists all registered connectors, versions, enforcements, and capabilities.
- `prumo-agent connector install <name>`: installs any registered connector and sets up cleanup manifests.
- `prumo-agent connector validate <name>`: verifies connector artifact integrity and ownership markers.
- `prumo-agent connector uninstall <name>`: performs clean removal.
- `prumo-agent connector negotiate <name> [--strict] [--caps <list>]`: evaluates compatibility and graceful degradations.
- All unit and integration tests pass with race detection enabled.
