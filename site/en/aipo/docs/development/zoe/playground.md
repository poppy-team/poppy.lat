---
title: "Playground"
description: "Aipo — Playground"
project: aipo
category: development
locale: en
sourcePath: "docs/en/zoe/playground.md"
sourceBlob: "9db9295e10d740cc3502ad4653acc05471dd5bc6"
revision: "7d51026653301c3048a41e2cf4026e3429c3a3b9"
license: "MIT"
---
::: info Static copy
Copied from `docs/en/zoe/playground.md` in [https://github.com/poppy-team/aipo-lang](https://github.com/poppy-team/aipo-lang) (MIT).
Pinned to revision `7d51026653301c3048a41e2cf4026e3429c3a3b9`, blob `9db9295e10d740cc3502ad4653acc05471dd5bc6`.
The source repository remains canonical; this copy is refreshed through a sync pull request, not live.
:::
# Interactive Zoe UI Playground

Explore **Zoe UI** and the **Leona** layout engine directly inside the documentation.

---

## Live Interactive Code Example

Zoe UI features a rich suite of built-in components styled with the Catppuccin palette. Below is an example combining split views, scrubber inputs, and the code editor:

```aipo
import aipo.zoe as zoe

fn view() {
    let pos_x = zoe.use_state(12.5)
    let script = zoe.use_state("fn on_start() {\n    print(\"Zoe UI Studio!\")\n}")

    let header = zoe.row({
        "height": 40.0,
        "background": zoe.color.mantle,
        "align_items": "center",
        "padding_x": 16.0,
        "gap": 12.0
    }, [
        zoe.icon("lucide:sparkles", { "color": zoe.color.blue, "size": 18.0 }),
        zoe.label("Zoe Playground Studio", { "font_weight": "bold", "color": zoe.color.text }),
        zoe.spacer(),
        zoe.badge("v0.2.0 SDF", { "background": zoe.color.surface_1, "color": zoe.color.green })
    ])

    let editor = zoe.code_editor({
        "code": script,
        "height": 240.0
    })

    let inspector = zoe.column({ "gap": 10.0, "padding": 12.0, "background": zoe.color.base }, [
        zoe.label("Transform Coordinates:", { "font_size": 12.0, "color": zoe.color.lavender }),
        zoe.scrubber_input({
            "label": "X",
            "value": pos_x,
            "min": -100.0,
            "max": 100.0,
            "width": "100%"
        }),
        zoe.button("Run Script", _ => print("Executing..."), { "variant": "primary" })
    ])

    return zoe.column({ "width": "100%", "height": "100%" }, [
        header,
        zoe.split_view({ "split": 0.65 }, editor, inspector)
    ])
}

fn setup() {
    zoe.mount(view)
}

fn update(dt) {
    zoe.step(dt)
}

fn draw() {
    zoe.draw_ui()
}
```

---

## 💻 Running Locally

To run the full integrated editor with GPU acceleration on your local machine:

```bash
cargo run -p aipo-game-host -- packages/aipo-zoe/examples/editor.aipo
```
