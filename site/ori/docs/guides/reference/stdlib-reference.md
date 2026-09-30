---
title: "Mapa da biblioteca padrão"
description: "Os módulos ori.X da biblioteca padrão, posições de texto e convenções de erro."
project: ori
category: guides
locale: pt-BR
sourcePath: "docs/guides/stdlib-reference.pt-BR.md"
sourceBlob: "71529b3cf8eab2a85fab0b74147b19eff06672bd"
revision: "42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f"
license: "MIT"
---
::: info Cópia estática
Copiado de `docs/guides/stdlib-reference.pt-BR.md` em [https://github.com/poppy-team/ori-lang](https://github.com/poppy-team/ori-lang) (MIT).
Fixado na revisão `42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f`, blob `71529b3cf8eab2a85fab0b74147b19eff06672bd`.
O repositório de origem permanece canônico; esta cópia é atualizada por um pull request de sincronização, não em tempo real.
:::
# Mapa de referência da biblioteca padrão

> **English:** [stdlib-reference.md](/en/ori/docs/guides/reference/stdlib-reference)
> **Contratos normativos:** [spec/12-stdlib.md](https://github.com/poppy-team/ori-lang/blob/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/docs/spec/12-stdlib.md)

A stdlib possui três camadas:

1. primitivas Layer 1 no runtime Rust;
2. wrappers seguros em `.orl`;
3. algoritmos escritos em Ori.

Prefira os módulos pais `ori.string`, `ori.list`, `ori.map` e equivalentes.
Paths antigos como `.utils` e `.algorithms` existem apenas por compatibilidade.

| Domínio | Módulos principais |
|---|---|
| I/O | `ori.io`, `ori.fs`, `ori.path` |
| Texto e bytes | `ori.string`, `ori.string_view`, `ori.bytes`, `ori.convert` |
| Collections e memória | `ori.list`, `ori.map`, `ori.set`, `ori.queue`, `ori.stack`, `ori.deque`, `ori.heap`, `ori.buffer`, `ori.slotmap`, `ori.span` |
| Gráficos e imagens | `ori.image` implementa geração de imagens BMP/PPM e struct `Image` |
| Erros e diagnósticos | `ori.err_trace`, `ori.fs.FsError`, `ori.net.http.HttpError` |
| Dados | `ori.json`, `ori.validate` |
| Tempo e aleatoriedade | `ori.time`, `ori.random`, `ori.format` |
| Processos | `ori.args`, `ori.config`, `ori.os`, `ori.process` |
| Rede | `ori.net`, `ori.net.http` (cliente HTTP e Response) |
| Concorrência e async | `ori.task`, `ori.channel`, `ori.atomic`, `ori.concurrent`, `ori.cancel` |
| Segurança | `ori.crypto` |
| Testes | `ori.test` |
| Estruturas | `ori.graph`, `ori.tree` |

```ori
import ori.io as io
import ori.fs (read_text_or)

main()
    const text: string = read_text_or("notes.txt", "")
    io.println(text)
end
```

As assinaturas completas estão em [12-stdlib.md](https://github.com/poppy-team/ori-lang/blob/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/docs/spec/12-stdlib.md). O site
usa os dados gerados por `ori doc export`; `ori doc check` valida docs inline e
sidecars `.oridoc`.

Os helpers assíncronos de filesystem, conexão e TLS usam um pool nativo
compartilhado e limitado (até quatro workers e 256 jobs na fila). Assim, uma
operação bloqueante não cria uma thread por requisição.

## Posições de texto e bytes

`string` armazena UTF-8 válido. `len(texto)`, `texto.len()`, slices, indexação,
`index_of`, `chars()` e iteração direta com `for` usam posições de valores
escalares Unicode. Essas APIs não expõem offsets de bytes UTF-8. Um grapheme
visível ainda pode conter vários escalares; use `bytes` e `string.to_bytes`
quando um protocolo exigir os bytes codificados. Segmentação de graphemes e
normalização ainda não fazem parte da stdlib.

Funções nativas são a referência semântica. `ori.io.read_line` retorna
`optional[string]`: `none` indica EOF ou entrada que não é UTF-8 válido.
