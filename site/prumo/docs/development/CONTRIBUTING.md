---
title: "CONTRIBUTING"
description: "Prumo — CONTRIBUTING"
project: prumo
category: development
locale: pt-BR
sourcePath: "docs/CONTRIBUTING.md"
sourceBlob: "f911d2b0ec2afbb6d1eeba2f9e2117af82ce4718"
revision: "e91694d3959be1ed92757b34063efe0b2191821f"
license: "MIT"
---
::: info Cópia estática
Copiado de `docs/CONTRIBUTING.md` em [https://github.com/poppy-team/prumo](https://github.com/poppy-team/prumo) (MIT).
Fixado na revisão `e91694d3959be1ed92757b34063efe0b2191821f`, blob `f911d2b0ec2afbb6d1eeba2f9e2117af82ce4718`.
O repositório de origem permanece canônico; esta cópia é atualizada por um pull request de sincronização, não em tempo real.
:::
# Contribuição e Evolução do Framework

O Prumo deve aprender com projetos reais sem virar um depósito de instruções específicas de cada projeto.

Uma mudança reutilizável deve identificar:

- problema recorrente;
- evidência;
- regra genérica;
- protocolo/schemas/catálogo/adapters afetados;
- impacto de compatibilidade/migração;
- impacto em tokens/custo/manutenção quando o comportamento do contexto muda.

## Checklist

- Mantenha o core neutro em relação a providers.
- Mantenha `ENTRYPOINT.md` e o `AGENTS.md` da raiz curtos.
- Mantenha Markdown + JSON como o orçamento de formatos mantidos por humanos.
- Um novo formato persistente exige justificativa em nível de ADR.
- Mantenha runtime/cache/dados derivados fora do estado canônico do Git.
- Atualize os schemas quando os contratos mudarem.
- Adicione testes para mudanças de comportamento/migração.
- Não embuta rankings atuais de modelos nas definições de papéis.
- Prefira seletores de capacidades/risco à duplicação por tecnologia.
- Prefira chunks virtuais semânticos a microarquivos de documentação.
- Mudanças de contexto precisam de um benchmark de tokens/qualidade e de uma regra de parada.
- A recursão profunda continua experimental, a menos que a evidência justifique a promoção.
