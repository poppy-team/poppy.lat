---
title: "Cross Language"
description: "Aipo — Cross Language"
project: aipo
category: development
locale: pt-BR
sourcePath: "docs/evidence/cross-language.md"
sourceBlob: "4a79e0f6902f1e6d96f07e56f7f5a11f86e22d27"
revision: "7d51026653301c3048a41e2cf4026e3429c3a3b9"
license: "MIT"
---
::: info Cópia estática
Copiado de `docs/evidence/cross-language.md` em [https://github.com/poppy-team/aipo-lang](https://github.com/poppy-team/aipo-lang) (MIT).
Fixado na revisão `7d51026653301c3048a41e2cf4026e3429c3a3b9`, blob `4a79e0f6902f1e6d96f07e56f7f5a11f86e22d27`.
O repositório de origem permanece canônico; esta cópia é atualizada por um pull request de sincronização, não em tempo real.
:::
# Benchmarks Cross-Language

O Aipo conta com um harness de benchmark padronizado (`aipo-bench --compare`) que confronta os tempos de execução e o consumo de memória (*Peak RSS*) contra linguagens consagradas do ecossistema.

---

## Escopo dos Testes

O objetivo é medir o custo real dos workloads equivalentes sem ocultar as diferenças arquiteturais fundamentais entre interpretadores, compiladores JIT e código nativo compilado:

- **Aipo VM In-Process**: Compilação realizada fora do cronômetro; medição da criação da VM, inicialização de frames e execução do bytecode.
- **Aipo CLI / VM (`aipo run`)**: Execução completa do processo a frio (leitura de arquivo, lexer, parser, semântica, bytecode e execução).
- **Aipo → JavaScript (Node.js)**: Execução do código emitido pelo `aipo-js` executado sobre a engine V8.
- **Runtimes de Referência**: Lua 5.4, LuaJIT, Wren 0.4.0, Luau 0.739, CPython 3.12, PyPy 8.0.0, Ruby e Rust nativo (controle algorítmico).

---

## Os Seis Workloads Canônicos

Todos os benchmarks geram uma soma de controle padronizada no formato `checksum:<valor>` para garantir que nenhum compilador eliminou trabalho computacional legítimo:

| Workload | Escopo Medido | Objetivo |
| :--- | :--- | :--- |
| `arithmetic` | Loop com chamadas de função e aritmética intensiva | Medir custo básico de despacho e chamadas de frame |
| `collections` | Construção dinâmica e iteração de listas | Custo de alocação no heap e travessia |
| `fields` | 6 campos em structs, mutação e métodos | Acesso a propriedades e despacho monomórfico |
| `strings` | Concatenação incremental ASCII | Gestão de buffers de texto e realocação |
| `recursion` | Cálculo recursivo de Fibonacci(24) | Profundidade de pilha e custo de chamada pura |
| `startup` | Inicialização mínima do processo | Custo de inicialização e carga da stdlib |

---

## Como Reproduzir os Resultados

Para reproduzir os números medidos em sua própria máquina:

```bash
# Compilar os binários em modo release otimizado
cargo build --release -p aipo-cli -p aipo-bench

# Executar a suíte de comparação completa
target/release/aipo-bench --compare --compare-json target/cross-language.json

# Execução rápida (desenvolvimento)
target/release/aipo-bench --compare --compare-quick
```
