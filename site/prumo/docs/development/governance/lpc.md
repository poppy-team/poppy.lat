---
title: "Lpc"
description: "Prumo — Lpc"
project: prumo
category: development
locale: pt-BR
sourcePath: "docs/governance/lpc.md"
sourceBlob: "18ffd6f8228d2a367ee6d5e7269f7e06b89da36d"
revision: "e91694d3959be1ed92757b34063efe0b2191821f"
license: "MIT"
---
::: info Cópia estática
Copiado de `docs/governance/lpc.md` em [https://github.com/poppy-team/prumo](https://github.com/poppy-team/prumo) (MIT).
Fixado na revisão `e91694d3959be1ed92757b34063efe0b2191821f`, blob `18ffd6f8228d2a367ee6d5e7269f7e06b89da36d`.
O repositório de origem permanece canônico; esta cópia é atualizada por um pull request de sincronização, não em tempo real.
:::
# Lean Progressive Context (LPC)

A metodologia **Lean Progressive Context (LPC)** é um dos diferenciais científicos centrais do Prumo. Ela foi concebida para resolver o problema da degradação cognitiva e alucinação de modelos de linguagem quando submetidos a janelas de contexto saturadas.

## Os Três Princípios Fundamentais

1. **Menor Contexto Suficiente (Smallest Sufficient Context)**: O agente não deve receber toda a base de código ou toda a árvore de documentação. Deve receber apenas a fatia estritamente necessária para cumprir a diretiva atual.
2. **Expansão Sob Demanda (Progressive Expansion)**: Se durante a execução for constatada a necessidade de entender uma dependência ou contrato adjacente, o agente utiliza ferramentas específicas para solicitar a expansão desse ponto focal.
3. **Saída Delimitada (Bounded Output)**: O agente nunca deve despejar centenas de linhas de logs, dumps de memória ou saídas completas de suítes de teste. Ferramentas ACI filtram e delimitam o output antes de entregá-lo ao LLM.

## Impacto Prático

| Métrica | Abordagem Tradicional (Megaprompt) | Prumo com LPC |
|---|---|---|
| **Consumo Médio de Tokens** | 80k – 200k tokens por turno | 4k – 12k tokens por turno |
| **Taxa de Alucinação** | Elevada (ruído acumulado) | Próxima de zero (foco estreito) |
| **Custo por Sessão** | Alto ($$$) | Redução de até 85% ($) |
| **Tempo de Resposta (TTFT)** | Lento (alta latência de prompt) | Ultrarrápido |
