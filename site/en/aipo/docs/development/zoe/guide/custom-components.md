---
title: "Custom Components"
description: "Aipo — Custom Components"
project: aipo
category: development
locale: en
sourcePath: "docs/en/zoe/guide/custom-components.md"
sourceBlob: "ef314fc5c310c809195cab25c61b6a9b6bc068ec"
revision: "7d51026653301c3048a41e2cf4026e3429c3a3b9"
license: "MIT"
---
::: info Static copy
Copied from `docs/en/zoe/guide/custom-components.md` in [https://github.com/poppy-team/aipo-lang](https://github.com/poppy-team/aipo-lang) (MIT).
Pinned to revision `7d51026653301c3048a41e2cf4026e3429c3a3b9`, blob `ef314fc5c310c809195cab25c61b6a9b6bc068ec`.
The source repository remains canonical; this copy is refreshed through a sync pull request, not live.
:::
# Creating Custom Components

Zoe UI features a standardized, extensible component authoring contract:

```aipo
fn make_custom_badge(props: Dict = {}, children: List = []) {
    let width_val = if props.has("width") then props["width"] else "auto"
    let height_val = if props.has("height") then props["height"] else 26.0

    return zoe.rect(
        {
            "tag": "custom_badge",
            "direction": "row",
            "align_items": "center",
            "width": width_val,
            "height": height_val,
            "padding_x": 8.0,
            "gap": 6.0,
            "background": zoe.color.surface_1,
            "border_radius": 4.0
        },
        children
    )
}
```

### Custom GPU Painting (`on_custom_draw`)

For specialized vector rendering (Bézier curves, radar charts, dials), provide `on_custom_draw`:

```aipo
fn make_custom_dial() {
    let on_custom_draw = fn(node) {
        if node == none or node.layout == none { return }
        let r = node.layout
        host_draw_circle(r.x + r.width / 2.0, r.y + r.height / 2.0, 24.0, 0.4, 0.7, 0.9, 1.0)
    }

    return zoe.rect({
        "tag": "dial",
        "width": 64.0,
        "height": 64.0,
        "on_custom_draw": on_custom_draw
    }, [])
}
```
