---
title: "Planos"
description: "O que está previsto para as próximas versões."
project: oride
category: roadmap
locale: pt-BR
sourcePath: "ROADMAP.md"
sourceBlob: "e00fbfc109aca046ac4cefef74afb68887e8db9a"
revision: "92a5262d466a8af9527cc49916ae438e217bb0e9"
license: "MIT"
---
::: info Static copy
Copied from `ROADMAP.md` in [https://github.com/poppy-team/oride](https://github.com/poppy-team/oride) (MIT).
Pinned to revision `92a5262d466a8af9527cc49916ae438e217bb0e9`, blob `e00fbfc109aca046ac4cefef74afb68887e8db9a`.
The upstream repository stays canonical; this copy is not updated automatically.
:::
# Oride Roadmap

[English Documentation](https://github.com/poppy-team/oride/blob/92a5262d466a8af9527cc49916ae438e217bb0e9/docs/en/planning/roadmap.md)) · [Documentação em Português](https://github.com/poppy-team/oride/blob/92a5262d466a8af9527cc49916ae438e217bb0e9/docs/planning/roadmap.md))
Welcome to the official roadmap for **Oride**, tracking our journey from the initial contained TUI foundation up to **Version 1.0 (LTS)**.

---

## 🧭 Milestone Summary

- [x] **`v0.1.0` — Contained Mini-IDE Baseline:** Rope buffers, project tree, embedded PTY, search, Git status, Markdown preview, on-demand LSP, splits.
- [x] **`v0.2.0` — First-Class Languages & Media:** 13 languages, terminal graphics protocols (Kitty/Sixel/iTerm2), Git sync & staging, session restore, Vim modal mode, task runner (`tasks.toml`), diagnostics (`:health`), dynamic i18n, universal installers.
- [ ] **`v0.3.0` — Extensibility & Editing Ergonomics:** Lua plugin engine (`mlua`), smart delimiter auto-pairing, modal text objects, PTY scrollback history, LSP symbol outline, self-update CLI command (`oride --update`).
- [ ] **`v0.4.0` — Extreme Performance & Large Files:** Large file streaming mode (>100MB), zero-copy viewport rendering, lazy grammar initialization (<5ms boot), interactive Git hunk staging.
- [ ] **`v0.5.0` — Code Intelligence & Refactoring:** LSP code actions / quickfixes (`Alt+Enter`), semantic symbol renaming (`F2`), tabstop snippets, diagnostics navigation.
- [ ] **`v0.6.0` — Large-Scale Fuzzy Matching & Sessions:** High-performance multi-threaded fuzzy matcher (100k+ files), crash recovery swap sessions, historical jump list.
- [ ] **`v0.7.0` — Visual Diffs & In-TUI Git Tooling:** Side-by-side split visual diff viewer, subtle inline Git blame virtual text, nested `.gitignore` and submodule support.
- [ ] **`v0.8.0` — Plugin Ecosystem & Sandboxing:** Dynamic language providers via Lua, declarative security sandbox (`config.toml`), expanded lifecycle hooks.
- [ ] **`v0.9.0` — TUI Accessibility & Unicode Hardening:** High-contrast themes, CJK & emoji width alignment, binary file protection, input fuzzing.
- [ ] **`v1.0.0` — Production Stability (LTS):** Lua API freeze, config schema freeze, automated latency (<5ms) and boot (<10ms) regression benchmarks, binary budget <= 12MB.

---

> For detailed specifications, acceptance criteria, and architectural constraints, read the full roadmap specifications:
> - **[English Roadmap Specification](https://github.com/poppy-team/oride/blob/92a5262d466a8af9527cc49916ae438e217bb0e9/docs/en/planning/roadmap.md))**
> - **[Especificação do Roadmap em Português](https://github.com/poppy-team/oride/blob/92a5262d466a8af9527cc49916ae438e217bb0e9/docs/planning/roadmap.md))**
