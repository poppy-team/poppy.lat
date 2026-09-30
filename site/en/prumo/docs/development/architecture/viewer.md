---
title: "Viewer"
description: "Prumo — Viewer"
project: prumo
category: development
locale: en
sourcePath: "docs/en/architecture/viewer.md"
sourceBlob: "e1c80c3148a3147f8ba8e8964715e6f94a25fdc8"
revision: "e91694d3959be1ed92757b34063efe0b2191821f"
license: "MIT"
---
::: info Static copy
Copied from `docs/en/architecture/viewer.md` in [https://github.com/poppy-team/prumo](https://github.com/poppy-team/prumo) (MIT).
Pinned to revision `e91694d3959be1ed92757b34063efe0b2191821f`, blob `e1c80c3148a3147f8ba8e8964715e6f94a25fdc8`.
The source repository remains canonical; this copy is refreshed through a sync pull request, not live.
:::
# Native Workspace Viewer (`prumo-viewer`)

The **Prumo Native Workspace Viewer** is a graphical and terminal visualization component implemented in Rust for instant navigation of massive repositories.

## Why Rust?

In projects with tens of thousands of files, hundreds of Goals, and complex dependency graphs, interfaces based on Electron or interpreted scripts suffer from excessive memory consumption and rendering latency. `prumo-viewer` delivers:

- **Sub-Millisecond Startup Time**: Direct filesystem access with a shared in-memory cache.
- **Fast DAG Rendering**: Interactive visualization of task graphs without freezes.
- **Extension Ecosystem**: A secure bus for custom visualization plugins.
- **Terminal Integration**: Works in harmony with `prumo-agent` (pa).

## Invoking the Viewer

```bash
# Start the native viewer in the current repository
prumo-viewer .

# Start focused on the graph of a specific Goal
prumo-viewer . --goal P01-G01
```
