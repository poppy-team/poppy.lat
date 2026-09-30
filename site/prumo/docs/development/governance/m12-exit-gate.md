---
title: "M12 Exit Gate"
description: "Prumo — M12 Exit Gate"
project: prumo
category: development
locale: pt-BR
sourcePath: "docs/governance/m12-exit-gate.md"
sourceBlob: "d0cdb67f7adb7a7bb582a0ea0fb080a12797bc93"
revision: "e91694d3959be1ed92757b34063efe0b2191821f"
license: "MIT"
---
::: info Cópia estática
Copiado de `docs/governance/m12-exit-gate.md` em [https://github.com/poppy-team/prumo](https://github.com/poppy-team/prumo) (MIT).
Fixado na revisão `e91694d3959be1ed92757b34063efe0b2191821f`, blob `d0cdb67f7adb7a7bb582a0ea0fb080a12797bc93`.
O repositório de origem permanece canônico; esta cópia é atualizada por um pull request de sincronização, não em tempo real.
:::
# M12 Team / Advanced Runtime — Avaliação de Governança e Status

Status: **ADIADO POR DESIGN (Conforme a Arquitetura e as Fases da v0.4)**

## Avaliação de Governança e Arquitetura

### Escopo e Especificação
Conforme `docs/development/phases.md:384-390`:
- **Escopo**: runtime compartilhado, leases, coordenação de concorrência, servidor opcional.
- **Pré-requisitos**: depende do M11, explicitamente condicionado: *"somente depois que o uso real validar a necessidade — adiado até que se prove necessário"*.

### Justificativa Arquitetural
1. **Lean Progressive Context e Core Neutro em Relação a Providers**:
   O Prumo prioriza o menor contexto suficiente, a execução determinística com um único agente e zero daemons ou servidores centrais desnecessários.
2. **Autonomia Local do Repositório**:
   Conforme documentado em `docs/architecture/overview.md` e `docs/runtime/control-plane.md`, o Prumo é otimizado para rodar localmente nos ambientes dos desenvolvedores e em pipelines de CI/CD sem exigir processos daemon de longa duração, servidores centralizados de leasing ou gerenciadores de locks distribuídos.
3. **Coordenação Multiagente via Experience Handoff (M9)**:
   O marco M9 introduziu o protocolo `Handoff` sem transcript, permitindo a transferência de estado entre múltiplos agentes, sequencial ou delegada, de forma limpa por meio de arquivos em `.prumo/experience/`, sem introduzir locking complexo distribuído em rede nem processos de servidor.
4. **Conclusão**:
   Conforme a governança formal do repositório, os recursos do M12 continuam adiados até que o uso real de times multiagente em produção demonstre uma necessidade empírica de um daemon compartilhado ou de coordenação de concorrência mediada por servidor.
