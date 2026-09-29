---
title: "Navigation"
description: "Aipo — Navigation"
project: aipo
category: development
locale: pt-BR
sourcePath: "docs/zoe/components/navigation.md"
sourceBlob: "450750659c436777d72d523e6940ce1ba4e94293"
revision: "3a5ce6737d42ae75470f7798680ebc95b3ac761c"
license: "MIT"
---
::: info Cópia estática
Copiado de `docs/zoe/components/navigation.md` em [https://github.com/poppy-team/aipo-lang](https://github.com/poppy-team/aipo-lang) (MIT).
Fixado na revisão `3a5ce6737d42ae75470f7798680ebc95b3ac761c`, blob `450750659c436777d72d523e6940ce1ba4e94293`.
O repositório de origem permanece canônico; esta cópia não é atualizada automaticamente.
:::
# Navegação e Listas Hierárquicas

Componentes para alternância de abas e navegação em árvores de dados.

---

## `tab_view` e `tab_bar`

Conjunto de abas profissionais com transição de conteúdo:

```aipo
let aba_ativa = zoe.use_state("hierarquia")

zoe.tab_view(
    {
        "active": aba_ativa,
        "tabs": [
            { "id": "hierarquia", "label": "Hierarquia" },
            { "id": "assets", "label": "Arquivos" }
        ]
    },
    {
        "hierarquia": arvore_cenas,
        "assets": lista_arquivos
    }
)
```

---

## `hierarchy_tree`

Árvore de cena inspirada na Unity e Godot, com linhas de indentação, carets de expansão/colapso, badges semânticos de tipo (`3D`, `2D`, `CAM`, `LGT`) e seleção em linha inteira (*Fitts's Law*):

```aipo
let entidade_selecionada = zoe.use_state("heroi")

let estrutura = [
    {
        "id": "root",
        "label": "CenaPrincipal",
        "type": "3d",
        "children": [
            { "id": "camera", "label": "Camera3D", "type": "camera" },
            { "id": "heroi", "label": "Jogador", "type": "3d" }
        ]
    }
]

zoe.hierarchy_tree({
    "nodes": estrutura,
    "selected": entidade_selecionada
})
```

---

## `virtual_list`

Lista virtualizada de alto desempenho com janela deslizante de itens $O(1)$. Gera somente os elementos visíveis no viewport, suportando coleções de 100.000+ linhas sem degradação de FPS.
