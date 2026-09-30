---
title: "Wave 2 Js Parity"
description: "Aipo — Wave 2 Js Parity"
project: aipo
category: guides
locale: pt-BR
sourcePath: "docs/trajectory/wave-2-js-parity.md"
sourceBlob: "82d4c1b7eac911c5cac34b4391ce964c5c5630f5"
revision: "21ad042c30a8e684be68da712ceb9e56eb9c7774"
license: "MIT"
---
::: info Cópia estática
Copiado de `docs/trajectory/wave-2-js-parity.md` em [https://github.com/poppy-team/aipo-lang](https://github.com/poppy-team/aipo-lang) (MIT).
Fixado na revisão `21ad042c30a8e684be68da712ceb9e56eb9c7774`, blob `82d4c1b7eac911c5cac34b4391ce964c5c5630f5`.
O repositório de origem permanece canônico; esta cópia é atualizada por um pull request de sincronização, não em tempo real.
:::
# Wave 2 — Backend JavaScript & Deep Quality

A **Wave 2** expandiu os horizontes do Aipo para a web e runtimes serverless através do emissor **`aipo-js`**, acompanhado por uma rodada profunda de endurecimento de qualidade e segurança (*Deep Quality Gauntlet*).

---

## Marcos Conquistados

### 1. O Emissor `aipo-js` & Runtime Shim
- Implementação de um compilador semântico de HIR para **JavaScript moderno (ES2022)**.
- Criação de um *runtime shim* modular e versionado que implementa:
  - O modelo de valores e referências do Aipo em JavaScript.
  - A semântica exata de falhas e transações com rollback de mutações em `attempt`.
  - Normalização Unicode NFC compatível.
  - Mapeamento preciso de código-fonte através de **Source Maps V3**.

### 2. Suíte de Paridade Diferencial VM ↔ JS
- Criação de um test runner diferencial automatizado:
  - Todo programa da suíte de conformance é executado na **VM nativa em Rust** e simultaneamente no **Node.js** com a saída transpilada.
  - Validação estrita de equivalência bit a bit de `stdout`, códigos de saída e diagnósticos de erro em 100% dos casos.

### 3. Deep Quality Gauntlet: Fuzzing & Testes de Propriedade
- Integração de suites de fuzzing com **libFuzzer** e `cargo-fuzz` para o Lexer e o Parser.
- Testes de propriedade com **proptest** cobrindo:
  - Parsing e unparsing resilientes.
  - Comportamento de números de ponto flutuante, inteiros e limites de estouro.
  - Normalização de caminhos e manipulação de strings UTF-8.

### 4. Política Estrita de Dependências (`cargo deny`)
- Configuração de políticas de segurança em `deny.toml`:
  - Auditoria automática contra vulnerabilidades conhecidas (RUSTSEC).
  - Bloqueio de licenças restritivas ou incompatíveis.
  - Banimento de duplicatas de crates no grafo de dependências do workspace.
