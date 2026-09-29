---
title: "Wave 1 Contracts"
description: "Aipo — Wave 1 Contracts"
project: aipo
category: guides
locale: pt-BR
sourcePath: "docs/trajectory/wave-1-contracts.md"
sourceBlob: "6326c12e81d93b5f6c7e140b87cde00ea483afa3"
revision: "3a5ce6737d42ae75470f7798680ebc95b3ac761c"
license: "MIT"
---
::: info Cópia estática
Copiado de `docs/trajectory/wave-1-contracts.md` em [https://github.com/poppy-team/aipo-lang](https://github.com/poppy-team/aipo-lang) (MIT).
Fixado na revisão `3a5ce6737d42ae75470f7798680ebc95b3ac761c`, blob `6326c12e81d93b5f6c7e140b87cde00ea483afa3`.
O repositório de origem permanece canônico; esta cópia não é atualizada automaticamente.
:::
# Wave 1 — Contratos, Rollback & Conformance

A **Wave 1** elevou o Aipo além de um interpretador convencional, introduzindo seu principal diferencial: **garantias estruturais de dados por meio de contratos de assinatura, invariantes com rollback atômico e interfaces formais**.

---

## Marcos Conquistados

### 1. Hooks de Construção e Invariantes (`init` e `invariant`)
- A adição do hook `init()` garantiu que estruturas recém-criadas passem por validações e normalizações antes de serem expostas ao restante do código.
- O bloco `invariant()` foi integrado às fronteiras estáveis de mutação. Cada vez que um campo de uma estrutura é alterado, o runtime valida a condição lógica declarada.

### 2. Rollback Transacional com `attempt ... recover`
- Criação de um mecanismo de **journal de mutações** na VM:
  - Quando um bloco `attempt` é aberto, todas as modificações em objetos são registradas em um diário de alterações.
  - Se ocorrer uma falha operacional (`fail`) ou a quebra de uma invariante (`invariant()`), o journal reverte atomicamente todas as estruturas para seus valores originais antes de transferir o controle para o bloco `recover`.
  - Se a execução for bem-sucedida, o journal é descartado sem custo de cópia residual.

### 3. Validação Estática e em Runtime de Interfaces
- Suporte a interfaces formais e conformidade estrutural:
  - O analisador semântico valida previamente a correspondência de nomes de métodos, aridade de parâmetros e compatibilidade do receptor `self`.
  - Em tempo de execução, chamadas através de interfaces realizam validação estrutural segura, disparando falhas determinísticas caso um objeto não conforme seja fornecido.

### 4. Suporte Completo a Funções Locais e Escopo de Módulo
- Fechamento da resolução de escopos com funções locais aninhadas e suporte a auto-recursão através da instrução de preenchimento de captura própria (`FillSelfCapture`).
- Acesso transparente e seguro a bindings declarados no escopo do módulo a partir de métodos de `impl` e closures.

### 5. Gauntlet de Conformance 100% Verde
- Certificação por 20 programas canônicos e 19 suítes de diagnósticos, atingindo 100% de conformidade nos quality gates (fmt, clippy, check, test, doc).
