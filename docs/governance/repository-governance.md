# Governança de Repositório

1. **Branches**:
   - `main`: Branch protegida e imutável diretamente. Pushes diretos são proibidos.
   - Padrão de branches de trabalho: `feat/*`, `fix/*`, `chore/*`, `docs/*`, `refactor/*`.

2. **Commits**:
   - Padrão Conventional Commits obrigatório: `tipo(escopo): descrição imperativa`.

3. **Pull Requests & Merge**:
   - Todo código entra em `main` via PR.
   - Estratégia de merge: `squash` com branch de trabalho deletada após o merge.
   - Quality gates do CI devem passar 100%: `pnpm check` (tipos), `pnpm test` (suíte sobre o build) e `pnpm build` (build estático, que falha em link interno quebrado).
