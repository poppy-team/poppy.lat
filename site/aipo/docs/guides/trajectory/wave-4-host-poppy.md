---
title: "Wave 4 Host Poppy"
description: "Aipo — Wave 4 Host Poppy"
project: aipo
category: guides
locale: pt-BR
sourcePath: "docs/trajectory/wave-4-host-poppy.md"
sourceBlob: "b46a76187c729be450312416cc45d9925774d68d"
revision: "3a5ce6737d42ae75470f7798680ebc95b3ac761c"
license: "MIT"
---
::: info Cópia estática
Copiado de `docs/trajectory/wave-4-host-poppy.md` em [https://github.com/poppy-team/aipo-lang](https://github.com/poppy-team/aipo-lang) (MIT).
Fixado na revisão `3a5ce6737d42ae75470f7798680ebc95b3ac761c`, blob `b46a76187c729be450312416cc45d9925774d68d`.
O repositório de origem permanece canônico; esta cópia não é atualizada automaticamente.
:::
# Wave 4 — Host ABI, Sandboxing & Poppy Engine

A **Wave 4** projetou a fronteira de segurança e interoperabilidade do Aipo com aplicações anfitriãs, formalizando a **Host ABI (`aipo-host`)** e validando-a na prática com a **Poppy Headless Simulation Engine (`aipo-poppy`)**.

---

## Marcos Conquistados

### 1. Crate `aipo-host` & Host Schema (AHS)
- Criação de um protocolo formal de comunicação entre o runtime da linguagem e qualquer código anfitrião em Rust:
  - **Capabilities Deny-by-Default**: Nenhuma função ou recurso do sistema (relógio, I/O, rede, arquivos) é acessível a menos que a aplicação anfitriã conceda explicitamente a capacidade correspondente através de uma árvore de permissões (`CapabilitySet`).
  - **Handles Geracionais (`HandleTable`)**: Objetos do host expostos ao Aipo são referenciados por identificadores geracionais com checagem estrita de geração e índice, eliminando vulnerabilidades de *use-after-free*.

### 2. Prevenção Estrita de Escape de Escopo (`Scope Escape`)
- Validação profunda nos 6 pontos de publicação da VM (`SetGlobal`, `Return`, `SetField`, `SetIndex`, `BuildList`, `BuildDict`):
  - Garante que handles ou valores atrelados a um ciclo de vida restrito não sobrevivam fora do seu escopo delimitado, disparando o diagnóstico determinístico `AIPO_RT_SCOPE_ESCAPE`.

### 3. Adaptador Poppy & Simulação Headless Determinística (`aipo-poppy`)
- Integração da linguagem com um motor de simulação ECS (Entity-Component-System):
  - Exposição segura do módulo `poppy` sob a capability `poppy.*`.
  - Buffer de comandos (`CommandBuffer`) com mutações estruturais deferidas para *safe points*, garantindo integridade das iterações.
  - Gerador de números pseudo-aleatórios com semente (`PoppyRng`), garantindo 100% de reproducibilidade matemática entre execuções repetidas.
  - Fixture de teste de integração demonstrando uma simulação completa de entidades sem interface gráfica, comprovando a estabilidade da Host ABI.
