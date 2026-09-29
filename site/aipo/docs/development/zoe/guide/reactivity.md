---
title: "Reactivity"
description: "Aipo — Reactivity"
project: aipo
category: development
locale: pt-BR
sourcePath: "docs/zoe/guide/reactivity.md"
sourceBlob: "d6c293eed234a7a2fb9b37dc324ddffccffddec7"
revision: "3a5ce6737d42ae75470f7798680ebc95b3ac761c"
license: "MIT"
---
::: info Cópia estática
Copiado de `docs/zoe/guide/reactivity.md` em [https://github.com/poppy-team/aipo-lang](https://github.com/poppy-team/aipo-lang) (MIT).
Fixado na revisão `3a5ce6737d42ae75470f7798680ebc95b3ac761c`, blob `d6c293eed234a7a2fb9b37dc324ddffccffddec7`.
O repositório de origem permanece canônico; esta cópia não é atualizada automaticamente.
:::
# Reatividade & Sinais no Zoe UI

O Zoe UI adota um modelo reativo baseado em **Sinais (*Signals*)**, combinando ergonomia declarativa a alto desempenho sem reconciliações virtuais pesadas de DOM.

---

## 1. `use_state` e `set_state`

Para declarar estado local reativo, use `zoe.use_state`:

```aipo
import aipo.zoe as zoe

fn view() {
    let name = zoe.use_state("Aventureiro")
    let hp = zoe.use_state(100.0)

    return zoe.column({ "gap": 8.0 }, [
        zoe.label(f"Herói: {name.get()} (HP: {hp.get()})"),
        zoe.button("Tomar Dano", _ => {
            let novo_hp = hp.get() - 15.0
            zoe.set_state(hp, if novo_hp < 0.0 then 0.0 else novo_hp)
        })
    ])
}
```

- `sig.get()`: Lê o valor atual contido no sinal.
- `zoe.set_state(sig, novo_valor)`: Atualiza o sinal e notifica o ciclo do framework que a árvore deve ser reconstruída.

---

## 2. `use_memo`

Para valores calculados onerosos que dependem de outros estados:

```aipo
let total_itens = zoe.use_memo(fn() {
    return inventario.get().len()
}, [inventario.get()])
```

O valor é armazenado em cache e recalculado somente quando as dependências na lista forem alteradas.

---

## 3. `use_tween` (Animações Suaves Interativas)

O Zoe UI inclui interpolação suave (*tweening*) integrada aos sinais do framework:

```aipo
# Anima de 0.0 até 100.0 em 0.5 segundos com easing ease_out
let progresso = zoe.use_tween(0.0, 100.0, 0.5, "ease_out")

# Durante o frame draw:
let x_animado = progresso.get()
```

O framework atualiza todos os tweens ativos a cada chamada de `zoe.step(dt)`, fornecendo movimentação e transição fluida a 60 FPS sem código manual de física.
