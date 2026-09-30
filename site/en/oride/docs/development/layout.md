---
title: "Layout"
description: "How the editor surface is organised into panels."
project: oride
category: development
locale: en
sourcePath: "docs/en/ui-ux/layout.md"
sourceBlob: "85a26df4efa5355e749c1d3bd71645730d12fde9"
revision: "1cd515630b8ceb57777d466bee4970fe7c2e30e0"
license: "MIT"
---
::: info Static copy
Copied from `docs/en/ui-ux/layout.md` in [https://github.com/poppy-team/oride](https://github.com/poppy-team/oride) (MIT).
Pinned to revision `1cd515630b8ceb57777d466bee4970fe7c2e30e0`, blob `85a26df4efa5355e749c1d3bd71645730d12fde9`.
The source repository remains canonical; this copy is refreshed through a sync pull request, not live.
:::
# Layout and Width Classes

## Classes

| Class | Width | What changes |
|---|---|---|
| `compact` | < 80 | The tree overlays instead of sitting side by side; the statusline shortens labels; the terminal panel takes the full width |
| `standard` | 80–119 | Full layout: tree, editor, and statusline side by side |
| `wide` | ≥ 120 | Like `standard`, with extra width for the tree and for the diagnostics column |

The limits are **inclusive at the bottom**: 80 is `standard`, 120 is `wide`.

## Rules

1. **Width is decided once per frame**, from the size the runtime
   hands over. No surface recomputes the class on its own.
2. **Nothing is cut off silently.** Whatever does not fit is truncated with a
   visible marker; a label that vanishes without a trace is indistinguishable from a label that never
   existed.
3. **Width is conservative.** An ambiguous-width character is treated as wide.
   Erring wide costs one column; erring narrow misaligns the entire
   line.
4. **Zero is a valid size.** A terminal that has not been measured yet must not make the
   editor panic or divide by zero.
