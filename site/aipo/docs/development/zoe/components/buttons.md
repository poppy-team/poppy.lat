---
title: "Buttons"
description: "Aipo — Buttons"
project: aipo
category: development
locale: pt-BR
sourcePath: "docs/zoe/components/buttons.md"
sourceBlob: "85484e817205ead2e72ff4ef31dab34e4efae12a"
revision: "21ad042c30a8e684be68da712ceb9e56eb9c7774"
license: "MIT"
---
::: info Cópia estática
Copiado de `docs/zoe/components/buttons.md` em [https://github.com/poppy-team/aipo-lang](https://github.com/poppy-team/aipo-lang) (MIT).
Fixado na revisão `21ad042c30a8e684be68da712ceb9e56eb9c7774`, blob `85484e817205ead2e72ff4ef31dab34e4efae12a`.
O repositório de origem permanece canônico; esta cópia é atualizada por um pull request de sincronização, não em tempo real.
:::
# Botões e Controles de Seleção

Componentes interativos para disparar ações e alternar modos.

---

## `button`

Botão com suporte a variantes táteis, ícones à esquerda e relevo em GPU com inner highlight de 1px.

```aipo
# Botão Simples
zoe.button("Salvar")

# Botão Primário com Ação e Ícone
zoe.button("Executar Jogo", on_play, {
    "variant": "primary",
    "icon": "lucide:play",
    "background": zoe.color.green
})

# Botão de Perigo
zoe.button("Excluir Entidade", on_delete, {
    "variant": "danger"
})
```

### Propriedades:
- `variant`: `"primary"` | `"secondary"` | `"ghost"` | `"danger"`
- `icon`: Identificador do ícone (ex: `"lucide:play"`, `"lucide:trash"`)
- `height`: Altura do botão (padrão: 32px)
- `tooltip`: Dica flutuante exibida ao pousar o cursor

---

## `segmented_group`

Controle em formato de pílula (*pill group*) para seleção mutuamente exclusiva de opções.

```aipo
let modo = zoe.use_state("2d")

zoe.segmented_group(
    [
        { "id": "2d", "label": "2D", "icon": "lucide:layers" },
        { "id": "3d", "label": "3D", "icon": "lucide:box" }
    ],
    modo
)
```

O item ativo recebe elevação visual e fundo contrastante automaticamente.
