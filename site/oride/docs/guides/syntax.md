---
title: "Sintaxe"
description: "A linguagem de edição usada nos arquivos do projeto."
project: oride
category: guides
locale: pt-BR
sourcePath: "docs/guides/pt/syntax.md"
sourceBlob: "56ff14947f010361ec7b89f3e2b6f9f2dd4fbaac"
revision: "92a5262d466a8af9527cc49916ae438e217bb0e9"
license: "MIT"
---
::: info Static copy
Copied from `docs/guides/pt/syntax.md` in [https://github.com/poppy-team/oride](https://github.com/poppy-team/oride) (MIT).
Pinned to revision `92a5262d466a8af9527cc49916ae438e217bb0e9`, blob `56ff14947f010361ec7b89f3e2b6f9f2dd4fbaac`.
The upstream repository stays canonical; this copy is not updated automatically.
:::
# Syntax highlight

Oride usa **tree-sitter** (e pipeline MD próprio) para colorir o buffer ativo.

## Linguagens first-class

**Normativo:** [docs/planning/alpha6-roadmap.md](https://github.com/poppy-team/oride/blob/92a5262d466a8af9527cc49916ae438e217bb0e9/docs/planning/alpha6-roadmap.md)) §3.

| LanguageId | Extensões | Grammar / motor | Estado |
|------------|-----------|-----------------|------------------|
| `rust` | `.rs` | `tree-sitter-rust` (estático) | **nativo estático** |
| `c` | `.c`, `.h` | `tree-sitter-c` (estático) | **nativo estático** |
| `bash` | `.sh`, `.bash`, `.zsh` | `tree-sitter-bash` (estático) | **nativo estático** |
| `markdown` | `.md`, … | `tree-sitter-md` + inject (estático) | **nativo estático** |
| `ori` / ori-lang | `.orl` | fallback léxico contido | **lexical** |
| `python` | `.py`, `.pyw` | dinâmico (`.so` / plugin) + fallback léxico | **plugin / fallback** |
| `javascript` | `.js`, `.mjs`, `.cjs` | dinâmico (`.so` / plugin) + fallback léxico | **plugin / fallback** |
| `typescript` | `.ts` | dinâmico (`.so` / plugin) + fallback léxico | **plugin / fallback** |
| `typescriptreact` | `.tsx` | dinâmico (`.so` / plugin) + fallback léxico | **plugin / fallback** |
| `ruby` | `.rb`, `.rake`, … | dinâmico (`.so` / plugin) + fallback léxico | **plugin / fallback** |
| `html` | `.html`, `.htm` | dinâmico (`.so` / plugin) + fallback léxico | **plugin / fallback** |
| `css` | `.css` | dinâmico (`.so` / plugin) + fallback léxico | **plugin / fallback** |
| `nim` | `.nim`, … | fallback léxico contido | **lexical** |
| `d` | `.d`, `.di` | fallback léxico contido | **lexical** |
| `lua` | `.lua` | fallback léxico contido | **lexical** |
| `oriscript` | `.oris` | `tree-sitter-oriscript` (estático legado) | **legado/estático** |
| `plain` | outras | — | sem highlight |

A linguagem ativa aparece na status line. Gramáticas dinâmicas são carregadas de `~/.config/oride/grammars/`, `.oride/grammars/` ou plugins instalados.

**Fence inject (MD):** o conteúdo de ` ```lang ` recebe highlight da linguagem.
Aliases disponíveis incluem `oris`/`oriscript`, `rust`/`rs`, `c`/`h`, `bash`/`sh`/`shell`, `python`/`py`, `js`/`javascript`, `ts`/`typescript`, `tsx`, `ruby`/`rb`, `d`/`dlang`, `lua`, `nim`, `html` e `css`.

## Como funciona

1. `detect_language(path)` escolhe o id.
2. `HighlightEngine` reparseia quando o texto muda.
3. Nós do AST → `HighlightKind` → cores em `UiTheme.syntax`.
4. Markdown blocks usam grammar MD; inlines e injects complementam.

## Crates

- `oride-syntax` — engine + kinds + detecção + MD preview lines
- `tree-sitter-oriscript` — binding da grammar legada OriScript (compatibilidade)
- grammars externas via crates `tree-sitter-*`

## Limitações

- Reparse completo por edit (não incremental) — ok para arquivos médios
- Cores de syntax no TOML: parcial (E1.4 no roadmap)
- Nim e Ori têm highlight léxico de keywords, tipos, funções, strings, números e
  comentários; recursos sintáticos mais profundos dependem de grammars estáveis
- Semantic tokens / multi-LSP: L2 no roadmap (opt-in)

## Validação

```bash
cargo test -p oride-syntax
```
