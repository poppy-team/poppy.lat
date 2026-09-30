---
title: "001 Architecture Baseline"
description: "Aipo — 001 Architecture Baseline"
project: aipo
category: development
locale: pt-BR
sourcePath: "docs/architecture/adr/001-architecture-baseline.md"
sourceBlob: "8b2e672013d69fb0663827a1361fe491582aa9bc"
revision: "21ad042c30a8e684be68da712ceb9e56eb9c7774"
license: "MIT"
---
::: info Cópia estática
Copiado de `docs/architecture/adr/001-architecture-baseline.md` em [https://github.com/poppy-team/aipo-lang](https://github.com/poppy-team/aipo-lang) (MIT).
Fixado na revisão `21ad042c30a8e684be68da712ceb9e56eb9c7774`, blob `8b2e672013d69fb0663827a1361fe491582aa9bc`.
O repositório de origem permanece canônico; esta cópia é atualizada por um pull request de sincronização, não em tempo real.
:::
# ADR 001: Linha de Base Arquitetural e Princípios de Clean Architecture

## Status
Parcialmente superseded — ver nota abaixo. O conteúdo genérico (SRP, DIP,
YAGNI) continua como orientação; as decisões de arquitetura do compilador
vivem em `docs/architecture/overview.md` + `docs/crates/crate-contracts.md`.

> Nota de supersessão (2026-09-20, auditoria de docs): este ADR foi escrito
> como boilerplate (menciona DTOs, persistência, drivers, "classes") e não
> descreve a arquitetura real — pipeline frontend → Core IR → dois backends,
> sem banco de dados, sem frameworks web, sem classes (Rust). Nada aqui foi
> apagado; onde este documento conflitar com `overview.md`/crate-contracts,
> estes vencem (ver `docs/language/authority-map.md`: contratos de arquitetura
> têm precedência como fonte do estado implementado).

## Contexto
O projeto requer alta manutenibilidade, isolamento rigoroso de regras de negócio em relação a frameworks e dependências externas, e suporte a testes unitários e de integração sem dependências de infraestrutura pesada.

## Decisão
Adotamos a Clean Architecture (Portas e Adaptadores). Todas as dependências devem apontar para o domínio central. Comunicações com infraestrutura externa devem ocorrer exclusivamente por meio de interfaces de portas.

## Consequências
- **Positivas**: Testabilidade completa em memória; facilidade de substituição de drivers de persistência; independência de frameworks.
- **Negativas**: Introdução de camadas intermediárias de mapeamento de dados (DTOs e entidades).
