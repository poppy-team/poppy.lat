---
title: "Clean Code Contract"
description: "Aipo — Clean Code Contract"
project: aipo
category: development
locale: en
sourcePath: "docs/en/architecture/clean-code-contract.md"
sourceBlob: "ee7d4aad5205f5072b44d938e0a54cdc73e9a442"
revision: "d9f9557e04871546a92b7ca1fcbc7e6f116803f8"
license: "MIT"
---
::: info Static copy
Copied from `docs/en/architecture/clean-code-contract.md` in [https://github.com/poppy-team/aipo-lang](https://github.com/poppy-team/aipo-lang) (MIT).
Pinned to revision `d9f9557e04871546a92b7ca1fcbc7e6f116803f8`, blob `ee7d4aad5205f5072b44d938e0a54cdc73e9a442`.
The source repository remains canonical; this copy is refreshed through a sync pull request, not live.
:::
# Architecture and Clean Code Contract

This document defines the **mandatory software engineering contract** for all implementations in this project.

## 1. Clean Code principles

1. **Explicit Responsibilities (SRP)**: Each module, class or package has a single reason to change.
2. **High Cohesion and Low Coupling**: Modules must be self-contained and interact only through abstract interfaces or typed contracts.
3. **Expressive Domain Names**: Variables, functions and types must reflect the ubiquitous language of the business. Do not use generic names such as `manager`, `helper`, `utils` or `data`.
4. **Small, Focused Functions**: Functions must perform only one logical action and ideally fit on one screen.
5. **Explicit Errors**: Silently swallowing exceptions (`bare except`, ignoring errors) is forbidden. Every error must be handled, wrapped or propagated with context.
6. **Zero Speculative Abstraction (YAGNI)**: Implement abstractions only when there are two or more proven concrete use cases.

## 2. Dependency direction (Clean Architecture)

- The dependency flow always points **inward**, toward the essential business rules.
- External mechanisms (databases, web frameworks, CLI, third-party libraries) are infrastructure details encapsulated by adapters.
- The application core is unaware of external protocols or specific cloud vendors.

## 3. Modularity and decoupling

- No package or module may import its consumer.
- Dependency cycles are strictly forbidden and checked in the CI pipeline.
- Every repository folder must be self-explanatory and contain its own `README.md`.
