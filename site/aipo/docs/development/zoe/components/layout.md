---
title: "Layout"
description: "Aipo — Layout"
project: aipo
category: development
locale: pt-BR
sourcePath: "docs/zoe/components/layout.md"
sourceBlob: "c3cb0f86f7f4866932bae1a6a8fbdbaf6bc2d6f7"
revision: "7d51026653301c3048a41e2cf4026e3429c3a3b9"
license: "MIT"
---
::: info Cópia estática
Copiado de `docs/zoe/components/layout.md` em [https://github.com/poppy-team/aipo-lang](https://github.com/poppy-team/aipo-lang) (MIT).
Fixado na revisão `7d51026653301c3048a41e2cf4026e3429c3a3b9`, blob `c3cb0f86f7f4866932bae1a6a8fbdbaf6bc2d6f7`.
O repositório de origem permanece canônico; esta cópia é atualizada por um pull request de sincronização, não em tempo real.
:::
# Contêineres de Layout

Contêineres estruturais para organização espacial com o motor Leona.

---

## `column`, `row`, `stack`, `center`

```aipo
# Organização Vertical
zoe.column({ "gap": 10.0, "padding": 16.0 }, [
    zoe.label("Item 1"),
    zoe.label("Item 2")
])

# Organização Horizontal com Alinhamento por Baseline
zoe.row({ "align_items": "baseline", "gap": 8.0 }, [
    zoe.icon("lucide:sparkles", { "size": 16.0 }),
    zoe.label("Destaque", { "font_size": 14.0 })
])

# Sobreposição (Stack)
zoe.stack({ "width": 400.0, "height": 300.0 }, [
    fundo_imagem,
    distintivo_flutuante
])

# Centralização Absoluta
zoe.center([
    zoe.label("Centralizado na Tela")
])
```

---

## `split_view`

Divisor redimensionável interativo para painéis estilo IDE e Blender:

```aipo
let split_pos = zoe.use_state(0.30) # 30% à esquerda

zoe.split_view(
    {
        "split": split_pos,
        "direction": "horizontal",
        "min_first": 150.0,
        "min_second": 200.0
    },
    painel_esquerdo,
    painel_direito
)
```

---

## `viewport`

Contêiner de exibição de cenas 2D ou 3D com tesoura de recorte em GPU (*hardware scissor clip*):

```aipo
zoe.viewport({
    "width": "100%",
    "height": "flex",
    "on_render": fn(rect) {
        # Código de renderização de cena 2D ou 3D
        zoe.draw_grid_3d(camera, rect)
    }
})
```
