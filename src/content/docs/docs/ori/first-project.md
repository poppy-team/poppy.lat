---
title: Primeiro projeto e pacotes locais
description: Crie um projeto Ori, execute o exemplo e conheça os comandos principais.
sidebar:
  order: 2
---

> Fonte: [`docs/guides/first-project.pt-BR.md`](https://github.com/poppy-team/ori-lang/blob/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/docs/guides/first-project.pt-BR.md) · revisão `42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f` · blob `7d9e2b408472e1d5d88e2cfb144007aed3c10396` · licença MIT.
>
> Esta é uma cópia estática de leitura. Ori e sua documentação completa continuam canônicos no repositório de origem.

**English:** [First project and local packages](/en/docs/ori/first-project/)

> Status: guia prático Ori **S3 + inferência B / workspace 0.3.8-dev**. Layout raiz-first (`ori.proj` + `main.orl`); consulte a [spec 17 no repositório canônico](https://github.com/poppy-team/ori-lang/blob/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/docs/spec/17-project-and-docs.md).

## Criar um projeto

```bash
ori new demo
cd demo
ori check main.orl
ori run main.orl
```

`ori new` cria:

```text
demo/
  ori.proj    # entry = "main.orl"
  main.orl
```

**Não** há pasta `src/` obrigatória. `docs/` é opcional (sidecars `.oridoc`).

## Comandos principais

```bash
ori check main.orl
ori run main.orl
ori compile main.orl --out demo
ori test main.orl
ori doctor
```

Teste:

```ori
module demo.main
import ori.test as test
@test
math_is_stable()
test.assert(1 + 1 == 2, "math should work")
end
```

## Biblioteca local

Estrutura e manifests: veja o [guia em inglês no repositório canônico](https://github.com/poppy-team/ori-lang/blob/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/docs/guides/first-project.md) (mesmos exemplos S3 com `module`, `import path = alias`, `ok`/`err` e `entry = "main.orl").

```bash
cd workspace/app
ori check main.orl
ori run main.orl
ori install demo.app --path .
```

Cache padrão: `~/.ori/packages/<name>/<version>/`.

Registry opcional (`ORI_REGISTRY` diretório ou HTTP):

```bash
ori publish . --registry /caminho/registry
ori install outro.pkg@0.1.0
```

O contrato de registry ainda é planejamento, sem push de loja. Veja o [documento canônico](https://github.com/poppy-team/ori-lang/blob/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/docs/planning/registry-v1.md).

## Após atualizar Ori

1. Leia o [changelog canônico](https://github.com/poppy-team/ori-lang/blob/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/CHANGELOG.md).
2. Execute `ori check` e `ori test`.
3. Para sintaxe pré-S3, use `ori migrate-syntax .`.

Próximos passos: [Cookbook em português](https://github.com/poppy-team/ori-lang/blob/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/docs/guides/cookbook.pt-BR.md) · [Tour da linguagem](https://github.com/poppy-team/ori-lang/blob/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/docs/language/tour.pt-BR.md) · [Instalação](https://github.com/poppy-team/ori-lang/blob/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/docs/install.pt-BR.md) · [Exemplos](https://github.com/poppy-team/ori-lang/tree/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/examples/)
