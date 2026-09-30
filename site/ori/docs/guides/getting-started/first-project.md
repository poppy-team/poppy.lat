---
title: "Primeiro projeto e pacotes locais"
description: "Como criar um projeto, declarar pacotes locais e compilar um primeiro programa."
project: ori
category: guides
locale: pt-BR
sourcePath: "docs/guides/first-project.pt-BR.md"
sourceBlob: "7d9e2b408472e1d5d88e2cfb144007aed3c10396"
revision: "42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f"
license: "MIT"
---
::: info Cópia estática
Copiado de `docs/guides/first-project.pt-BR.md` em [https://github.com/poppy-team/ori-lang](https://github.com/poppy-team/ori-lang) (MIT).
Fixado na revisão `42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f`, blob `7d9e2b408472e1d5d88e2cfb144007aed3c10396`.
O repositório de origem permanece canônico; esta cópia é atualizada por um pull request de sincronização, não em tempo real.
:::
# Primeiro projeto e pacotes locais

> Status: guia prático Ori **S3 + inferência B / workspace 0.3.8-dev**
> **English:** [first-project.md](/en/ori/docs/guides/getting-started/first-project)  
> Layout: raiz-first (`ori.proj` + `main.orl`) — [spec/17](https://github.com/poppy-team/ori-lang/blob/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/docs/spec/17-project-and-docs.md)

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

Estrutura e manifests: veja a versão em inglês (mesmos exemplos S3 com
`module`, `import path = alias`, `ok`/`err`, `entry = "main.orl"`).

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

Contrato: [registry-v1.md](https://github.com/poppy-team/ori-lang/blob/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/docs/planning/registry-v1.md) (planejamento; sem push
de loja).

## Após atualizar o Ori

1. Leia o [CHANGELOG.md](https://github.com/poppy-team/ori-lang/blob/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/CHANGELOG.md).
2. `ori check` / `ori test`.
3. Pré-S3: `ori migrate-syntax .`

Próximo: [Cookbook](/ori/docs/guides/manual/cookbook) · [Tour](/ori/docs/guides/getting-started/tour) ·
[Instalação](/ori/docs/guides/getting-started/install) · [Exemplos](https://github.com/poppy-team/ori-lang/blob/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/examples/)
