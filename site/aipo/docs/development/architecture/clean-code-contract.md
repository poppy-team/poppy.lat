---
title: "Clean Code Contract"
description: "Aipo — Clean Code Contract"
project: aipo
category: development
locale: pt-BR
sourcePath: "docs/architecture/clean-code-contract.md"
sourceBlob: "6b53f4a229e6e8b680d34d648dc6d09a200e0090"
revision: "7d51026653301c3048a41e2cf4026e3429c3a3b9"
license: "MIT"
---
::: info Cópia estática
Copiado de `docs/architecture/clean-code-contract.md` em [https://github.com/poppy-team/aipo-lang](https://github.com/poppy-team/aipo-lang) (MIT).
Fixado na revisão `7d51026653301c3048a41e2cf4026e3429c3a3b9`, blob `6b53f4a229e6e8b680d34d648dc6d09a200e0090`.
O repositório de origem permanece canônico; esta cópia é atualizada por um pull request de sincronização, não em tempo real.
:::
# Contrato de Arquitetura e Clean Code

Este documento define o **contrato mandatório de engenharia de software** para todas as implementações deste projeto.

## 1. Princípios de Clean Code

1. **Responsabilidades Explícitas (SRP)**: Cada módulo, classe ou pacote possui uma única razão para mudar.
2. **Alta Coesão e Baixo Acoplamento**: Módulos devem ser auto-contidos e interagir apenas através de interfaces abstratas ou contratos tipados.
3. **Nomes Expressivos de Domínio**: Variáveis, funções e tipos devem refletir a linguagem ubíqua do negócio. Não utilize nomes genéricos como `manager`, `helper`, `utils` ou `data`.
4. **Funções Pequenas e Focadas**: Funções devem realizar apenas uma ação lógica e caber idealmente em uma tela de visualização.
5. **Erros Explícitos**: Proibido suprimir exceções silenciosamente (`bare except`, ignorar erros). Todo erro deve ser tratado, encapsulado ou propagado com contexto.
6. **Zero Abstração Especulativa (YAGNI)**: Implemente abstrações somente quando houver dois ou mais casos de uso concretos comprovados.

## 2. Direção das Dependências (Clean Architecture)

- O fluxo de dependência aponta sempre **para dentro**, em direção às regras de negócio essenciais.
- Mecanismos externos (bancos de dados, frameworks web, CLI, bibliotecas de terceiros) são detalhes de infraestrutura encapsulados por adapters.
- O core da aplicação desconhece protocolos externos ou fornecedores específicos de nuvem.

## 3. Modularidade e Desacoplamento

- Nenhum pacote ou módulo pode importar seu consumidor.
- Ciclos de dependência são estritamente proibidos e checados no pipeline de CI.
- Toda pasta do repositório deve ser autoexplicativa e conter seu respectivo `README.md`.
