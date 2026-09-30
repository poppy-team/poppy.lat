---
title: "Buttons"
description: "Aipo — Buttons"
project: aipo
category: development
locale: en
sourcePath: "docs/en/zoe/components/buttons.md"
sourceBlob: "7ba1b33fc09a57efbb9ade99a4efbddd76acefd1"
revision: "d9f9557e04871546a92b7ca1fcbc7e6f116803f8"
license: "MIT"
---
::: info Static copy
Copied from `docs/en/zoe/components/buttons.md` in [https://github.com/poppy-team/aipo-lang](https://github.com/poppy-team/aipo-lang) (MIT).
Pinned to revision `d9f9557e04871546a92b7ca1fcbc7e6f116803f8`, blob `7ba1b33fc09a57efbb9ade99a4efbddd76acefd1`.
The source repository remains canonical; this copy is refreshed through a sync pull request, not live.
:::
# Buttons & Selection Controls

Interactive components for triggering actions and toggling states.

---

## `button`

SDF button with inner top highlight, variant styling, and optional icons:

```aipo
zoe.button("Save Changes", on_save, {
    "variant": "primary",
    "icon": "lucide:save"
})

zoe.button("Delete Entity", on_delete, {
    "variant": "danger",
    "icon": "lucide:trash"
})
```

---

## `segmented_group`

Pill toggle group for mutually exclusive options:

```aipo
let mode = zoe.use_state("2d")

zoe.segmented_group([
    { "id": "2d", "label": "2D", "icon": "lucide:layers" },
    { "id": "3d", "label": "3D", "icon": "lucide:box" }
], mode)
```
