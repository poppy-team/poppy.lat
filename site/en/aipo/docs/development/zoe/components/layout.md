---
title: "Layout"
description: "Aipo — Layout"
project: aipo
category: development
locale: en
sourcePath: "docs/en/zoe/components/layout.md"
sourceBlob: "55da2b515061c14cf81e165d085d712f3fec611f"
revision: "21ad042c30a8e684be68da712ceb9e56eb9c7774"
license: "MIT"
---
::: info Static copy
Copied from `docs/en/zoe/components/layout.md` in [https://github.com/poppy-team/aipo-lang](https://github.com/poppy-team/aipo-lang) (MIT).
Pinned to revision `21ad042c30a8e684be68da712ceb9e56eb9c7774`, blob `55da2b515061c14cf81e165d085d712f3fec611f`.
The source repository remains canonical; this copy is refreshed through a sync pull request, not live.
:::
# Layout Containers

Structural containers for spatial arrangement with the Leona layout engine.

---

## `column`, `row`, `stack`, `center`

```aipo
# Vertical Column
zoe.column({ "gap": 10.0, "padding": 16.0 }, [
    zoe.label("Item A"),
    zoe.label("Item B")
])

# Horizontal Row with Font Baseline Alignment
zoe.row({ "align_items": "baseline", "gap": 8.0 }, [
    zoe.icon("lucide:star", { "size": 16.0 }),
    zoe.label("Featured", { "font_size": 14.0 })
])

# Overlapping Stack
zoe.stack({ "width": 400.0, "height": 300.0 }, [
    background_layer,
    foreground_badge
])
```

---

## `split_view` and `viewport`

- **`split_view`**: Resizable split pane with horizontal or vertical dividers.
- **`viewport`**: Hardware-clipped rendering container for 2D/3D scenes and camera projections.
