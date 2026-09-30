---
title: "Getting Started"
description: "Aipo — Getting Started"
project: aipo
category: development
locale: en
sourcePath: "docs/en/zoe/guide/getting-started.md"
sourceBlob: "56efe7b621c3ab1acbdeec9a017af1688903e931"
revision: "21ad042c30a8e684be68da712ceb9e56eb9c7774"
license: "MIT"
---
::: info Static copy
Copied from `docs/en/zoe/guide/getting-started.md` in [https://github.com/poppy-team/aipo-lang](https://github.com/poppy-team/aipo-lang) (MIT).
Pinned to revision `21ad042c30a8e684be68da712ceb9e56eb9c7774`, blob `56efe7b621c3ab1acbdeec9a017af1688903e931`.
The source repository remains canonical; this copy is refreshed through a sync pull request, not live.
:::
# Getting Started with Zoe UI

This guide walks you through setup, initialization, and application lifecycle with **Zoe UI**.

---

## 1. Installation & Setup

Add the package dependency to your `aipo.toml`:

```toml
[package]
name = "my-app"
version = "0.1.0"

[dependencies]
"aipo.zoe" = { path = "packages/aipo-zoe" }
```

Lock package dependencies:

```bash
aipo package lock
```

---

## 2. The Lifecycle Triad: `setup`, `update`, `draw`

Graphical Aipo applications follow the 3-stage lifecycle:

```aipo
import aipo.zoe as zoe

# 1. UI Root View
fn view() {
    return zoe.center({ "background": zoe.color.base }, [
        zoe.label("Hello, Zoe UI!", { "font_size": 20.0, "color": zoe.color.text })
    ])
}

# 2. Setup: mount root component function
fn setup() {
    zoe.mount(view)
}

# 3. Update: process inputs, signals, and tweens
fn update(dt) {
    zoe.step(dt)
}

# 4. Draw: render calculated node tree to GPU
fn draw() {
    zoe.draw_ui()
}
```

### What happens in each stage?

- **`zoe.mount(component_fn)`**: Connects your generator function to the framework loop and computes initial Leona layout.
- **`zoe.step(dt)`**: Handles mouse hover, clicks, drags, scroll wheel, and keyboard events. Re-evaluates dirty trees when signals change, and steps active `use_tween` animations.
- **`zoe.draw_ui()`**: Converts the computed layout into GPU analytical primitives (`host_draw_sdf_rect`, `host_draw_text`, `host_draw_bezier`) with scissor clipping and layer sorting.

---

## 3. DevTools Inspector

Zoe UI includes an integrated live bounding box inspector:

```aipo
# Press F12 or call directly in your code:
zoe.toggle_inspector()
```
