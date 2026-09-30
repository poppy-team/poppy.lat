---
title: "Compiler Frontend"
description: "Aipo — Compiler Frontend"
project: aipo
category: development
locale: pt-BR
sourcePath: "docs/architecture/compiler-frontend.md"
sourceBlob: "0255e5908bf83b08b43b959f676d5cf31e69a26e"
revision: "21ad042c30a8e684be68da712ceb9e56eb9c7774"
license: "MIT"
---
::: info Cópia estática
Copiado de `docs/architecture/compiler-frontend.md` em [https://github.com/poppy-team/aipo-lang](https://github.com/poppy-team/aipo-lang) (MIT).
Fixado na revisão `21ad042c30a8e684be68da712ceb9e56eb9c7774`, blob `0255e5908bf83b08b43b959f676d5cf31e69a26e`.
O repositório de origem permanece canônico; esta cópia é atualizada por um pull request de sincronização, não em tempo real.
:::
# Frontend do Compilador

O frontend do Aipo é responsável por processar o código-fonte em texto puro até a geração da representação semântica validada.

---

## Estágios do Pipeline

### 1. `aipo-source`
- Representa o arquivo fonte e seu conteúdo em memória.
- Fornece indexação de linhas e colunas segura em relação a fronteiras UTF-8 (`is_char_boundary`), garantindo compatibilidade estrita com a MSRV (Rust 1.85+).

### 2. `aipo-lexer`
- Converte o fluxo de caracteres UTF-8 em uma sequência contígua de tokens.
- Otimização com zero alocações na identificação de palavras-chave através de casamento direto sobre `&str`.
- Rejeição canônica de números decimais malformados (como `1.e5` ou `1._5`), gerando o diagnóstico estático `AIPO_LEX_INVALID_NUMBER`.

### 3. `aipo-syntax` & `aipo-ast`
- Parser descendente recursivo (*recursive descent*) com recuperação resiliente de falhas (`synchronize`).
- Preservação de anotações `async` em métodos de `interface`.
- Desaçucaramento no parser de comparações contínuas (como `val >= 0 and <= 100`).
- Suporte a expressões condicionais em linha (`if c then a else b`).

### 4. `aipo-hir`
- Lowering da AST para High-Level Intermediate Representation.
- Unificação de spans nos hooks de ciclo de vida (`init` e `invariant`).
- Resolução de referências de escopo local e de módulo.

### 5. `aipo-sema`
- Validador semântico com checagem de tipos estrita e verificação de contratos:
  - Verificação de contratos de `interface` via subtipagem estrutural automática (métodos obrigatórios, aridades, mutabilidade do receptor `self` vs `var self`, tipos de parâmetros e retornos).
  - Proibição estática de mutação de campos imutáveis de estruturas (`AIPO_SEM_IMMUTABLE_FIELD_REASSIGN`).
  - Diagnósticos dedicados para concorrência (`AIPO_SEM_AWAIT_IN_SUBEXPRESSION`, `AIPO_SEM_FORGOTTEN_TASK`, `AIPO_SEM_NESTED_AWAIT_DO`).
