---
title: "Trust Model"
description: "Prumo — Trust Model"
project: prumo
category: development
locale: pt-BR
sourcePath: "docs/governance/trust-model.md"
sourceBlob: "d8272b3e38b6f3774b2b12ba673747bbe50cdbe6"
revision: "e91694d3959be1ed92757b34063efe0b2191821f"
license: "MIT"
---
::: info Cópia estática
Copiado de `docs/governance/trust-model.md` em [https://github.com/poppy-team/prumo](https://github.com/poppy-team/prumo) (MIT).
Fixado na revisão `e91694d3959be1ed92757b34063efe0b2191821f`, blob `d8272b3e38b6f3774b2b12ba673747bbe50cdbe6`.
O repositório de origem permanece canônico; esta cópia é atualizada por um pull request de sincronização, não em tempo real.
:::
# Modelo de Confiança & Segurança

O Prumo opera sob um modelo de **privilégio mínimo e isolamento estrito**. Agentes autônomos recebem apenas as permissões explicitamente concedidas pelo perfil do projeto.

## Níveis de Confiança

1. **Repositório Canônico (Nível Máximo)**: Arquivos versionados em Git com hashes íntegros. Nenhuma IA pode mutar esses arquivos sem passar por validação de portão (gate).
2. **Ambiente de Desenvolvimento Local**: O usuário humano detém autoridade suprema e pode revogar ou abortar qualquer execução do harness a qualquer momento.
3. **Agentes de IA (Nível Restrito)**: Executam em sandboxes de diretivas, sem acesso a segredos ou variáveis de ambiente de produção, com comandos restritos à whitelist do perfil.
4. **Fontes Externas & Web (Não Confiável)**: Qualquer dado recuperado da internet ou de pacotes terceiros é considerado não confiável até validação explícita de conformidade.
