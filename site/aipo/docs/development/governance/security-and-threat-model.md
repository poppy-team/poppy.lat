---
title: "Security And Threat Model"
description: "Aipo — Security And Threat Model"
project: aipo
category: development
locale: pt-BR
sourcePath: "docs/governance/security-and-threat-model.md"
sourceBlob: "04b33c29009e72f44b4124f44ffa7fba1a44093a"
revision: "3a5ce6737d42ae75470f7798680ebc95b3ac761c"
license: "MIT"
---
::: info Cópia estática
Copiado de `docs/governance/security-and-threat-model.md` em [https://github.com/poppy-team/aipo-lang](https://github.com/poppy-team/aipo-lang) (MIT).
Fixado na revisão `3a5ce6737d42ae75470f7798680ebc95b3ac761c`, blob `04b33c29009e72f44b4124f44ffa7fba1a44093a`.
O repositório de origem permanece canônico; esta cópia não é atualizada automaticamente.
:::
# Segurança & Sandboxing

A segurança da linguagem Aipo é baseada no modelo de **mínimo privilégio** e na **prevenção ativa de vulnerabilidades de runtime**.

---

## Princípios de Segurança

1. **Zero Segredos Hardcoded**: O código-fonte, testes e manifestos nunca contêm credenciais, chaves de API ou tokens de acesso.
2. **Negação por Padrão (*Deny by Default*)**: Nenhuma capacidade do sistema hospedeiro (arquivos, variáveis de ambiente, relógio, rede) é concedida a scripts sem autorização explícita do anfitrião.
3. **Isolamento de Memória contra Use-After-Free**: Os objetos do host expostos ao Aipo utilizam handles geracionais com invalidação atômica de slots.
4. **Proteção contra Negação de Serviço (DoS)**:
   - Limite máximo de profundidade de aninhamento no parser (256 níveis) para impedir estouro de pilha.
   - Orçamento opcional de instruções (*gas budget*) para conter laços infinitos em scripts de terceiros.
   - Limite de tamanho de leitura em varints LEB128 para mitigar estouro de inteiros.
5. **Hermeticidade de Supply-Chain**:
   - Dependências remotas exigem commit SHA fixo no manifesto `aipo.toml`.
   - Verificação criptográfica automática com hashes SHA-256 no cache local.
   - Builds de produção operam 100% offline sem risco de substituição maliciosa em tempo de build.
