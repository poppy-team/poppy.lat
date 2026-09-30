---
title: "Repository Governance"
description: "Aipo — Repository Governance"
project: aipo
category: development
locale: pt-BR
sourcePath: "docs/governance/repository-governance.md"
sourceBlob: "6b3bedb62c4b8cd65d72e8c3e48b3e70e9df6879"
revision: "21ad042c30a8e684be68da712ceb9e56eb9c7774"
license: "MIT"
---
::: info Cópia estática
Copiado de `docs/governance/repository-governance.md` em [https://github.com/poppy-team/aipo-lang](https://github.com/poppy-team/aipo-lang) (MIT).
Fixado na revisão `21ad042c30a8e684be68da712ceb9e56eb9c7774`, blob `6b3bedb62c4b8cd65d72e8c3e48b3e70e9df6879`.
O repositório de origem permanece canônico; esta cópia é atualizada por um pull request de sincronização, não em tempo real.
:::
# Governança de Repositório

1. **Branches**:
   - `main`: branch principal. Prática atual (desenvolvedor solo): push direto
     com todos os gates verdes antes do push; quando houver colaboradores,
     passa a valer PR obrigatório com branch protegida.
   - Padrão de branches de trabalho: `feat/*`, `fix/*`, `chore/*`, `docs/*`, `refactor/*`.

2. **Commits**:
   - Mensagens descritivas no imperativo, referenciando o Goal quando houver
     (`P01-G02: ...`); Conventional Commits (`tipo(escopo): ...`) recomendado.

3. **Pull Requests & Merge** (quando houver colaboradores):
   - Todo código entra em `main` via PR.
   - Estratégia de merge: `squash` com branch de trabalho deletada após o merge.
   - Quality gates do CI devem passar 100%: `cargo fmt --check`, `cargo check`,
     `cargo clippy -D warnings`, `cargo test`, `cargo doc`, `prumo validate`,
     `prumo doctor` (ver `docs/testing/ci-tiers.md` para os tiers).
