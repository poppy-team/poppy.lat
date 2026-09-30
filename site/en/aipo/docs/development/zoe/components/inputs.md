---
title: "Inputs"
description: "Aipo — Inputs"
project: aipo
category: development
locale: en
sourcePath: "docs/en/zoe/components/inputs.md"
sourceBlob: "a7da1fd2867ff88dd8c3efe48b87fb52b7376094"
revision: "7d51026653301c3048a41e2cf4026e3429c3a3b9"
license: "MIT"
---
::: info Static copy
Copied from `docs/en/zoe/components/inputs.md` in [https://github.com/poppy-team/aipo-lang](https://github.com/poppy-team/aipo-lang) (MIT).
Pinned to revision `7d51026653301c3048a41e2cf4026e3429c3a3b9`, blob `a7da1fd2867ff88dd8c3efe48b87fb52b7376094`.
The source repository remains canonical; this copy is refreshed through a sync pull request, not live.
:::
# Input Fields

Precision input components designed for developer tooling and numeric editing.

---

## `scrubber_input`

Blender-style horizontal drag input with tactile modifier keys:
- **Normal drag**: Standard increment ($\times 0.2\times\text{step}$).
- <kbd>Shift</kbd> + **drag**: Micro precision ($\times 0.02\times\text{step}$).
- <kbd>Ctrl</kbd> + **drag**: Fast snap ($\times 2.0\times\text{step}$).

```aipo
let pos_x = zoe.use_state(0.0)

zoe.scrubber_input({
    "label": "X",
    "label_color": zoe.color.peach,
    "value": pos_x,
    "step": 1.0,
    "min": -500.0,
    "max": 500.0,
    "precision": 1,
    "width": "flex"
})
```

---

## `text_input`, `dropdown_select`, `color_picker`

- **`text_input`**: Alphanumeric text editing with blinking cursor and focus management.
- **`dropdown_select`**: Selection menu rendered in an elevated overlay.
- **`color_picker`**: Catppuccin palette picker with immediate swatch feedback.
