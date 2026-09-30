---
title: "Layout Leona"
description: "Aipo — Layout Leona"
project: aipo
category: development
locale: en
sourcePath: "docs/en/zoe/guide/layout-leona.md"
sourceBlob: "5616d88b5e76e5f566d5c0e702969ad1d5e76db0"
revision: "21ad042c30a8e684be68da712ceb9e56eb9c7774"
license: "MIT"
---
::: info Static copy
Copied from `docs/en/zoe/guide/layout-leona.md` in [https://github.com/poppy-team/aipo-lang](https://github.com/poppy-team/aipo-lang) (MIT).
Pinned to revision `21ad042c30a8e684be68da712ceb9e56eb9c7774`, blob `5616d88b5e76e5f566d5c0e702969ad1d5e76db0`.
The source repository remains canonical; this copy is refreshed through a sync pull request, not live.
:::
# The Leona 2.0 Layout Engine

**Leona** is the canonical layout engine of Zoe UI. Written entirely in pure Aipo, it computes bounding boxes, proportional flex distribution, and text-driven geometry with subpixel accuracy.

---

## 1. The Three Passes of Leona 2.0

1. **Pass 1: Intrinsic Measurement**: Leaf nodes (`label`, `icon`, `button`, `badge`, `segment_item`) measure their exact content dimensions using real TTF font metrics via `host_measure_text` and `host_font_metrics`.
2. **Pass 2: Flex Distribution & Clamping**: Flex containers divide remaining main-axis space without overflowing bounds.
3. **Pass 3: Font Baseline Alignment**: In `row` containers configured with `align_items: "baseline"`, items of varying sizes align along the typographic baseline rather than geometric centers.

---

## 2. Dimension Properties

| Property | Example | Meaning |
| :--- | :--- | :--- |
| `width`, `height` | `120.0` | Fixed pixel size |
| `width`, `height` | `"100%"`, `"50%"` | Relative percentage of parent inner space |
| `width`, `height` | `"flex"` | Elastic flex share of remaining space |
| `width`, `height` | `"auto"` | Shrink-wrap to fit child content |
| `min_width`, `max_width` | `80.0`, `400.0` | Strict boundary constraints |
| `min_height`, `max_height` | `24.0`, `600.0` | Strict vertical constraints |
