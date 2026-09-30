---
title: "Repository Governance"
description: "Aipo — Repository Governance"
project: aipo
category: development
locale: en
sourcePath: "docs/en/governance/repository-governance.md"
sourceBlob: "2f3009325cdc4ae8d449c3edd8296d13d32a5ec7"
revision: "21ad042c30a8e684be68da712ceb9e56eb9c7774"
license: "MIT"
---
::: info Static copy
Copied from `docs/en/governance/repository-governance.md` in [https://github.com/poppy-team/aipo-lang](https://github.com/poppy-team/aipo-lang) (MIT).
Pinned to revision `21ad042c30a8e684be68da712ceb9e56eb9c7774`, blob `2f3009325cdc4ae8d449c3edd8296d13d32a5ec7`.
The source repository remains canonical; this copy is refreshed through a sync pull request, not live.
:::
# Repository Governance

1. **Branches**:
   - `main`: the main branch. Current practice (solo developer): direct push
     with all gates green before the push; once there are collaborators,
     mandatory PRs with a protected branch take effect.
   - Working-branch naming pattern: `feat/*`, `fix/*`, `chore/*`, `docs/*`, `refactor/*`.

2. **Commits**:
   - Descriptive messages in the imperative mood, referencing the Goal when there is one
     (`P01-G02: ...`); Conventional Commits (`type(scope): ...`) recommended.

3. **Pull Requests & Merge** (once there are collaborators):
   - All code enters `main` via PR.
   - Merge strategy: `squash`, with the working branch deleted after the merge.
   - CI quality gates must pass 100%: `cargo fmt --check`, `cargo check`,
     `cargo clippy -D warnings`, `cargo test`, `cargo doc`, `prumo validate`,
     `prumo doctor` (see `docs/testing/ci-tiers.md` for the tiers).
