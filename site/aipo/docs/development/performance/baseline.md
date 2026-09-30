---
title: "Baseline"
description: "Aipo — Baseline"
project: aipo
category: development
locale: pt-BR
sourcePath: "docs/performance/baseline.md"
sourceBlob: "10fb2ec9f10f024874755fa02f2a5acf5b0d8e91"
revision: "21ad042c30a8e684be68da712ceb9e56eb9c7774"
license: "MIT"
---
::: info Cópia estática
Copiado de `docs/performance/baseline.md` em [https://github.com/poppy-team/aipo-lang](https://github.com/poppy-team/aipo-lang) (MIT).
Fixado na revisão `21ad042c30a8e684be68da712ceb9e56eb9c7774`, blob `10fb2ec9f10f024874755fa02f2a5acf5b0d8e91`.
O repositório de origem permanece canônico; esta cópia é atualizada por um pull request de sincronização, não em tempo real.
:::
# Baseline de Performance do Aipo

**Status:** registro (artefato gerado, não é um gate)
**Escopo:** baselines de wall-clock para estágios do frontend, comandos, workloads da VM, o backend JS e a suíte cross-language separada
**Ambiente:** Linux x86_64 (4 CPU, 5 GiB RAM), rustc 1.98.1, Node v24.18.0, `--release`, runner compartilhado (ruidoso — veja a coluna MAD)
**Registrado em:** 2026-09-20, `cargo run --release -p aipo-bench` (7 amostras, mediana/MAD), git a8709881

Estes números são baselines para comparação futura em um runner dedicado, **não** limiares de aprovação/reprovação. Para o protocolo multi-runtime, as amostras brutas, os checksums e as regras de justiça, veja `docs/performance/cross-language.md`.

## Estágios do frontend (mediana)

| estágio | 858 B | 9 KiB | 99 KiB | 1023 KiB |
|---|---|---|---|---|
| bytecode/compile+verify | 34.12µs | 347.30µs | 3.91ms | 45.94ms |
| formatter/format | 50.16µs | 561.38µs | 9.55ms | 78.44ms |
| hir/lower | 24.52µs | 224.03µs | 4.18ms | 41.71ms |
| ir/lower | 19.97µs | 239.95µs | 4.27ms | 39.82ms |
| lexer/tokenize | 24.13µs | 275.36µs | 5.36ms | 58.56ms |
| sema/check | 14.65µs | 105.30µs | 2.43ms | 24.32ms |
| source/new | 1.90µs | 15.45µs | 179.48µs | 2.23ms |
| syntax/parse | 77.95µs | 861.32µs | 11.42ms | 102.74ms |

## Comandos e workloads da VM (mediana)

| workload | entrada | mediana | MAD |
|---|---|---|---|
| cmd/check | 858 B | 188.04µs | 7.59µs |
| cmd/run | 858 B | 349.31µs | 6.43µs |
| cmd/build-emit | 858 B | 483.31µs | 4.75µs |
| cmd/fmt-check | 858 B | 94.61µs | 2.92µs |
| vm/int-arith | 43 B | 217.06µs | 1.62µs |
| vm/float-arith | 46 B | 206.48µs | 1.16µs |
| vm/call-overhead | 61 B | 223.84µs | 625ns |
| vm/recursion | 75 B | 13.79ms | 315.07µs |
| vm/closure-shared-var | 94 B | 274.68µs | 12.55µs |
| vm/global-lookup | 45 B | 218.07µs | 7.66µs |
| vm/list-build-iter | 74 B | 503.85µs | 33.07µs |
| vm/dict-insert-lookup | 78 B | 226.62µs | 2.02µs |
| vm/string-concat | 39 B | 477.75µs | 2.80µs |
| vm/interpolation | 43 B | 222.32µs | 2.16µs |
| vm/bytes-alloc | 49 B | 77.50µs | 611ns |
| vm/pipeline | 40 B | 142.71µs | 389ns |
| vm/failure-propagate | 112 B | 175.88µs | 180ns |
| vm/attempt | 68 B | 106.75µs | 262ns |
| vm/contracts | 71 B | 179.25µs | 1.07µs |
| vm/invariant-commit | 167 B | 212.84µs | 1.34µs |

## Backend JS (frontend + emit + spawn do node + execução)

| workload | entrada | mediana | MAD |
|---|---|---|---|
| js/emit | 858 B | 288.64µs | 13.93µs |
| js/emit | 9 KiB | 4.00ms | 178.16µs |
| js/emit | 99 KiB | 57.60ms | 4.30ms |
| js/emit | 1023 KiB | 576.11ms | 16.64ms |
| js/hello | 17 B | 57.64ms | 5.16ms |
| js/integrated | 858 B | 72.06ms | 6.68ms |

O spawn do processo Node domina os workloads pequenos (~50–70 ms no total). A medição cross-language separa Aipo VM in-process, Aipo CLI/VM e Aipo→JavaScript; comparações de steady-state ainda exigem runner dedicado.

## Escalonamento (construção/iteração de list, inserção em dict, N=200..1600)

Todas as razões ficam próximas de 2× a cada dobra neste runner — comportamento linear; os veredictos reportam o ruído com honestidade. Razões brutas:

- `list-build: N=200..1600 ratios [1.73x, 2.17x, 1.66x] verdict=noisy — rerun on dedicated runner`
- `list-iterate: N=200..1600 ratios [1.88x, 2.07x, 1.86x] verdict=noisy — rerun on dedicated runner`
- `dict-insert: N=200..1600 ratios [1.75x, 1.87x, 2.02x] verdict=noisy — rerun on dedicated runner`

## Achado notável durante este gauntlet

O parsing de format-strings escalava 68× a cada 10× de entrada (medidos 23.4 ms para 400 f-strings em 8.4 KiB). Causa raiz: padding `" ".repeat(offset)` por placeholder mais rescans completos. Corrigido fazendo o parsing de slices sem padding e deslocando os spans de volta (`crates/aipo-syntax/src/shift.rs`, adendo do ADP-005): 1.77 ms depois, custo proporcional ao offset eliminado, snapshots do corpus idênticos byte a byte.
