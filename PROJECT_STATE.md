# Current Project State

- Project: **Poppy Team**
- Prumo: **0.6.0**
- Current phase: **P01 — Documentation by project**
- Current goal: **P01-G01 — VitePress documentation platform (DRAFT)**
- Context methodology: **Lean Progressive Context (LPC)**
- Last updated: `2026-09-28`

## Completed in this execution

- The site was migrated from Astro + Starlight to VitePress + Vue 3 + TypeScript, with static output and no server adapter. The decision is recorded in ADR 003.
- Four projects now have their own documentation section under `/docs/<slug>/` and `/en/docs/<slug>/`, organised into user guide, changelog and roadmap, and development.
- Documentation for Ori, Aipo, Oride and Prumo is vendored from their canonical repositories. Each copy is read at its pinned revision, and the import aborts if the blob does not match the manifest.
- Integration runs both ways: each project page lists its documentation pages, and each documentation page links back to the project page and to the canonical repository.
- Each project has its own visual identity, derived from the `project` field in page frontmatter, preserved across the light and dark themes.
- `pnpm check`, `pnpm build`, `pnpm test` and `pnpm test:e2e` pass. The Vitest suite runs against the emitted HTML and covers routes, provenance and licenses, bidirectional integration, locale parity, per-project identity, and every internal link.
- The Playwright suite runs against a fresh build in a real browser and covers what HTML inspection cannot: that editorial pages do not inherit the documentation sidebar, search box or navigation, that the home title does not overlap the following text, that per-project identity is applied in both themes, that the skip link and focus outline work, and that no page scrolls horizontally at 1440px, 850px or 390px.
- The Poppy Team mark lives in `site/public/assets/` in two variants. The dark variant reuses the light geometry exactly, and a test enforces the three allowed fills per variant.
- Goal `P00-G01` is `DONE`; `P01-G01` is registered at `.ai/goals/P01/P01-G01.goal.json`.

## Documentation coverage

The documentation under each project subsite is a curated copy, and the curation
now has a declared source rather than a judgement made here. The Aipo and Prumo
repositories ship the VitePress config for their own site, and its `srcExclude`
list is the set of paths those projects decided not to publish. The allow-list
is measured against that criterion by `pnpm derive:allowlist`.

Current coverage against the projects' own criterion:

| Project | Criterion | Published |
|---|---|---|
| Aipo | `srcExclude`, 18 patterns | 151 pages, 71 in English |
| Prumo | `srcExclude`, 74 patterns | 30 pages |
| Ori | none upstream | 2 pages |
| Oride | none upstream | 12 pages, 5 in English |

Aipo and Prumo are imported by walking their documentation tree and keeping what
their own site config publishes, so the coverage is complete by construction
rather than by selection. The English tree is walked separately, so a page
published only in Portuguese is not duplicated in English.

Ori and Oride still ship no site config, so their pages come from the explicit
list in packages/project-data. Ori has one page because the site the project
publishes is not in this repository.

Two pages were removed on this basis: the Oride changelog and roadmap, and the
Prumo changelog. All three live at their repository root, outside the
documentation tree, and none of the three projects publishes them on its own
site. The allow-list had been reaching outside the documentation tree to reach
them, which is the thing the curation rule exists to prevent.

Closing the gap means importing the publishable set rather than a sample of it,
which is a decision about scope and repository size, not about tooling.

## Deployment

Production is a single VitePress project on the personal `raillen` Vercel account,
built from this repository with `vercel deploy --prod`. The build command, output
directory and install command live in `vercel.json` and are mirrored on the project
settings, because the Astro framework preset inherited from the previous stack
overrides the committed configuration.

**Automatic deploys are not connected.** A push to a branch does not trigger a
deployment: the Vercel project has no Git repository linked, so every deploy is
manual. The cause is the Vercel account, not the repository. `GET /v2/user` reports
`linkedAccounts: null` for `raillen`, so there is no GitHub identity on the account
that owns the project, and connecting a private repository requires one. The GitHub
credentials available here are fine — the `gh` token carries `repo` and reads the
private repository without trouble, and Vercel can already build from a ref it reads
through the API. What is missing is the interactive link step, which has to be done
once, by hand, in the Vercel dashboard or `vercel git connect` from a session where
the account is signed in.

## Limitations and next actions

- The website domain has not been approved, so the build emits no sitemap and no canonical alternates.
- The route `/projetos/<slug>/` became `/projects/<slug>/`. Existing links to the old form need a redirect at the host; this is configured in `vercel.json` and must be verified after the next deployment.
- Prumo's English documentation for most of Prumo does not exist upstream yet. Those pages are published as explicit stubs pointing at the Portuguese version and the canonical source, rather than duplicated untranslated text.
- Screenshots of every page, theme and viewport are generated by `pnpm screenshots` and were reviewed during the migration, but automated checks do not replace a human reading them. Screen-reader review is still pending.
- `prumo docs authority`, `readiness` and `plan` are blocked by the scaffold's missing `docs/AUTHORITY_MAP.json` and `docs/contracts/bindings.json`. Do not report those checks as passed.

Next: run `pnpm validate:prumo`, open a pull request for `feat/vitepress-migration`, and verify the redirects on the deployed domain.

## Recovery order

1. `ENTRYPOINT.md` or the platform adapter.
2. `prumo.json`.
3. `PROJECT_STATE.md`.
4. `docs/PRUMO.md`.
5. Active Goal under `.ai/goals/`.
6. Only relevant canonical docs/symbols/tests selected by the context strategy.

Do not load the entire repository by default.
