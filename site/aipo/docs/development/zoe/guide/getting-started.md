---
title: "Getting Started"
description: "Aipo — Getting Started"
project: aipo
category: development
locale: pt-BR
sourcePath: "docs/zoe/guide/getting-started.md"
sourceBlob: "e38d67d464d64fe9fea83a2b2e9f0a186f82cf68"
revision: "21ad042c30a8e684be68da712ceb9e56eb9c7774"
license: "MIT"
---
::: info Cópia estática
Copiado de `docs/zoe/guide/getting-started.md` em [https://github.com/poppy-team/aipo-lang](https://github.com/poppy-team/aipo-lang) (MIT).
Fixado na revisão `21ad042c30a8e684be68da712ceb9e56eb9c7774`, blob `e38d67d464d64fe9fea83a2b2e9f0a186f82cf68`.
O repositório de origem permanece canônico; esta cópia é atualizada por um pull request de sincronização, não em tempo real.
:::
# Primeiros Passos com Zoe UI

Este guia orienta a inicialização, configuração e ciclo de vida de uma aplicação com **Zoe UI**.

---

## 1. Instalação e Configuração

Para utilizar o Zoe UI, referencie o pacote no manifesto `aipo.toml`:

```toml
[package]
name = "meu-app"
version = "0.1.0"

[dependencies]
"aipo.zoe" = { path = "packages/aipo-zoe" }
```

Gere ou sincronize a trava do pacote com:

```bash
aipo package lock
```

---

## 2. A Tríade do Ciclo de Vida: `setup`, `update`, `draw`

Aplicações gráficas no ecossistema Aipo adotam o ciclo clássico de três estágios:

```aipo
import aipo.zoe as zoe

# 1. Ponto de montagem da UI
fn view() {
    return zoe.center({ "background": zoe.color.base }, [
        zoe.label("Olá, Zoe UI!", { "font_size": 20.0, "color": zoe.color.text })
    ])
}

# 2. Inicialização: registra a função raiz de visualização
fn setup() {
    zoe.mount(view)
}

# 3. Atualização física/lógica: despacha eventos do mouse e animações de tweens
fn update(dt) {
    zoe.step(dt)
}

# 4. Renderização gráfica: despacha a árvore calculada para os shaders de GPU
fn draw() {
    zoe.draw_ui()
}
```

### O que acontece em cada estágio?

- **`zoe.mount(component_fn)`**: Vincula a função geradora de nós ao ciclo do framework. Avalia a primeira árvore declarativa e computa as dimensões globais com Leona.
- **`zoe.step(dt)`**: Inspeciona a posição do cursor do mouse, estado dos botões, roda de rolagem e teclas digitadas. Se algum sinal (`Signal`) foi alterado, o Zoe marca a árvore como `dirty` e agenda a reavaliação do layout. Também interpola animações ativas via `use_tween`.
- **`zoe.draw_ui()`**: Transforma a árvore calculada em comandos analíticos de GPU (`host_draw_sdf_rect`, `host_draw_text`, `host_draw_bezier`) com ordenação de camadas e tesouras de recorte (*scissor clipping*).

---

## 3. Modo Inspecionar (DevTools Inspector)

O Zoe UI inclui um inspecionador visual de caixas delimitadoras integrado:

```aipo
# Pressione F12 ou invoque diretamente no seu código:
zoe.toggle_inspector()
```

Quando ativado, o inspetor desenha contornos azuis semitransparentes em torno de cada contêiner e exibe uma etiqueta flutuante com a tag do nó, seu identificador e suas dimensões exatas em pixels.
