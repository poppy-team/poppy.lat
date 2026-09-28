# Current Project State

- Project: **Poppy Team**
- Prumo: **0.6.0**
- Current phase: **P00 — Foundation**
- Current goal: **P00-G01 — Astro + Starlight bilingual site spike (EXECUTING)**
- Context methodology: **Lean Progressive Context (LPC)**
- Last updated: `2026-09-28`

## Completed in this execution

- Astro + TypeScript + Starlight generate a static bilingual site: PT-BR at `/`, EN at `/en/`.
- Project, blog, selected documentation, source manifest, and license notice routes are present in the build.
- `pnpm check`, `pnpm build`, and `pnpm test` pass. The Node test suite checks route presence, locale content, source manifest/notices, and internal links.
- Prumo Goal inventory has one registered P00-G01 at `.ai/goals/P00/P00-G01.goal.json` in `EXECUTING` state.
- The Poppy Team mark is the site logo in two variants: `src/assets/poppy-logo.svg` (light) and `src/assets/poppy-logo-dark.svg` (dark). It renders next to the typographic wordmark in the Astro header and in the Starlight documentation header, where Starlight picks the variant for the active theme. The drawing has no wordmark text yet, so the typographic wordmark stays in place.
- Responsive coverage now runs through `1100px`, `850px`, `600px` and `400px`, with touch-sized navigation targets from `850px` down and a `280px` layout floor.

## Limitations and next actions

- The website domain has not been approved, so Astro's built-in sitemap integration reports that `site` is missing and skips sitemap generation.
- Browser-based visual, keyboard and screen-reader review remains pending; no browser is available in this environment.
- `prumo docs authority`, `readiness` and `plan` are blocked by the scaffold's missing `docs/AUTHORITY_MAP.json` and `docs/contracts/bindings.json`. Do not report those checks as passed.
- Goal evidence has not yet been ingested. Keep P00-G01 in `EXECUTING` until its required evidence and review gates are satisfied.

Next: run `pnpm validate:prumo`, review the generated routes/links, then record evidence using Prumo's supported report workflow.

## Recovery order

1. `ENTRYPOINT.md` or the platform adapter.
2. `prumo.json`.
3. `PROJECT_STATE.md`.
4. `docs/PRUMO.md`.
5. Active Goal under `.ai/goals/`.
6. Only relevant canonical docs/symbols/tests selected by the context strategy.

Do not load the entire repository by default.
