---
title: "Viewer"
description: "Prumo — Viewer"
project: prumo
category: development
locale: pt-BR
sourcePath: "docs/architecture/viewer.md"
sourceBlob: "637a2198b5a97e53d98c08bc27f6b821781e1a39"
revision: "0f643d1c4fa8ac789cee878fbcd035f214f4eb4a"
license: "MIT"
---
::: info Cópia estática
Copiado de `docs/architecture/viewer.md` em [https://github.com/poppy-team/prumo](https://github.com/poppy-team/prumo) (MIT).
Fixado na revisão `0f643d1c4fa8ac789cee878fbcd035f214f4eb4a`, blob `637a2198b5a97e53d98c08bc27f6b821781e1a39`.
O repositório de origem permanece canônico; esta cópia não é atualizada automaticamente.
:::
# Native Workspace Viewer (`prumo-viewer`)

O **Prumo Native Workspace Viewer** é um componente de visualização gráfica e de terminal implementado em Rust para navegação instantânea em repositórios massivos.

## Por que Rust?

Em projetos com dezenas de milhares de arquivos, centenas de Metas e grafos complexos de dependências, interfaces baseadas em Electron ou scripts interpretados sofrem com consumo excessivo de memória e latência de renderização. O `prumo-viewer` entrega:

- **Tempo de Inicialização Sub-Milissegundo**: Acesso direto ao sistema de arquivos com cache em memória compartilhada.
- **Renderização Rápida de DAGs**: Visualização interativa de grafos de tarefas sem travamentos.
- **Ecosistema de Extensões**: Barramento seguro para plugins de visualização customizados.
- **Integração com o Terminal**: Funciona em harmonia com o `prumo-agent` (pa).

## Invocando o Viewer

```bash
# Iniciar o visualizador nativo no repositório atual
prumo-viewer .

# Iniciar focado no grafo de uma Meta específica
prumo-viewer . --goal P01-G01
```
