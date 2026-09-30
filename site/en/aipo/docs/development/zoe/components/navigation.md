---
title: "Navigation"
description: "Aipo — Navigation"
project: aipo
category: development
locale: en
sourcePath: "docs/en/zoe/components/navigation.md"
sourceBlob: "cc8931158334a9e177bf10b4da2422d947cd5461"
revision: "7d51026653301c3048a41e2cf4026e3429c3a3b9"
license: "MIT"
---
::: info Static copy
Copied from `docs/en/zoe/components/navigation.md` in [https://github.com/poppy-team/aipo-lang](https://github.com/poppy-team/aipo-lang) (MIT).
Pinned to revision `7d51026653301c3048a41e2cf4026e3429c3a3b9`, blob `cc8931158334a9e177bf10b4da2422d947cd5461`.
The source repository remains canonical; this copy is refreshed through a sync pull request, not live.
:::
# Navigation & Tree Lists

Components for tab switching and hierarchical data inspection.

---

## `tab_view`

Professional tab views with content switching:

```aipo
let active_tab = zoe.use_state("scene")

zoe.tab_view(
    {
        "active": active_tab,
        "tabs": [
            { "id": "scene", "label": "Scene" },
            { "id": "assets", "label": "Assets" }
        ]
    },
    {
        "scene": scene_tree,
        "assets": asset_list
    }
)
```

---

## `hierarchy_tree`

Scene hierarchy tree with rail guide lines, expand/collapse carets, semantic type badges (`3D`, `2D`, `CAM`, `LGT`), and full-width row selection:

```aipo
let selected = zoe.use_state("player")

let nodes = [
    {
        "id": "root",
        "label": "RootScene",
        "type": "3d",
        "children": [
            { "id": "camera", "label": "MainCamera", "type": "camera" },
            { "id": "player", "label": "Player", "type": "3d" }
        ]
    }
]

zoe.hierarchy_tree({
    "nodes": nodes,
    "selected": selected
})
```

---

## `virtual_list`

Virtual scrolling list providing $O(1)$ windowed element rendering for large collections of 100,000+ items.
