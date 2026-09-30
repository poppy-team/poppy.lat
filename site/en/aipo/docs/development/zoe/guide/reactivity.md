---
title: "Reactivity"
description: "Aipo — Reactivity"
project: aipo
category: development
locale: en
sourcePath: "docs/en/zoe/guide/reactivity.md"
sourceBlob: "1703397a67aba6f958a2a4f541c018ef599c4986"
revision: "d9f9557e04871546a92b7ca1fcbc7e6f116803f8"
license: "MIT"
---
::: info Static copy
Copied from `docs/en/zoe/guide/reactivity.md` in [https://github.com/poppy-team/aipo-lang](https://github.com/poppy-team/aipo-lang) (MIT).
Pinned to revision `d9f9557e04871546a92b7ca1fcbc7e6f116803f8`, blob `1703397a67aba6f958a2a4f541c018ef599c4986`.
The source repository remains canonical; this copy is refreshed through a sync pull request, not live.
:::
# Reactivity & Signals in Zoe UI

Zoe UI adopts a signal-based reactivity model, delivering clean ergonomics without virtual DOM overhead.

---

## 1. `use_state` and `set_state`

Declare local reactive state using `zoe.use_state`:

```aipo
import aipo.zoe as zoe

fn view() {
    let name = zoe.use_state("Adventurer")
    let hp = zoe.use_state(100.0)

    return zoe.column({ "gap": 8.0 }, [
        zoe.label(f"Hero: {name.get()} (HP: {hp.get()})"),
        zoe.button("Take Damage", _ => {
            let next_hp = hp.get() - 15.0
            zoe.set_state(hp, if next_hp < 0.0 then 0.0 else next_hp)
        })
    ])
}
```

---

## 2. `use_memo`

Cache expensive calculations dependent on other signals:

```aipo
let total_items = zoe.use_memo(fn() {
    return inventory.get().len()
}, [inventory.get()])
```

---

## 3. `use_tween`

Animate smoothly with built-in tweening:

```aipo
let anim_progress = zoe.use_tween(0.0, 100.0, 0.5, "ease_out")
let current_val = anim_progress.get()
```
