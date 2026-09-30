---
title: "Bootstrapping"
description: "Como compilar o Ori a partir do código-fonte."
project: ori
category: development
locale: pt-BR
sourcePath: "docs/guides/bootstrapping.pt-BR.md"
sourceBlob: "c3e1d5a5a1aa4e9525ad9890b2d04c81a5776716"
revision: "42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f"
license: "MIT"
---
::: info Cópia estática
Copiado de `docs/guides/bootstrapping.pt-BR.md` em [https://github.com/poppy-team/ori-lang](https://github.com/poppy-team/ori-lang) (MIT).
Fixado na revisão `42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f`, blob `c3e1d5a5a1aa4e9525ad9890b2d04c81a5776716`.
O repositório de origem permanece canônico; esta cópia é atualizada por um pull request de sincronização, não em tempo real.
:::
# Bootstrapping do Ori

> **Público:** contribuidores que compilam o projeto a partir do código-fonte
> **English:** [bootstrapping.md](/en/ori/docs/development/bootstrapping)

Usuários finais devem preferir o [pacote de instalação](/ori/docs/guides/getting-started/install).
Como o compilador ainda é escrito em Rust, o bootstrap de desenvolvimento usa
Rust 1.95, um compilador C/CRT do sistema e os scripts de staging do runtime.

```bash
cd compiler
cargo build -p ori-runtime --lib --release
cargo build -p ori-driver --release
```

Depois, use `tools/stage_native_runtime.sh` ou o equivalente PowerShell para
copiar staticlib e cdylib para `runtime/<triple>/`. O pacote final contém o
executável, `stdlib/`, runtime e, quando necessário, `rust-lld` empacotado. O
usuário final não precisa de `cargo` nem `rustc`.

O self-hosting é uma etapa futura (M4), não um requisito para instalar ou usar
Ori. A definição de ABI está em [19-abi.md](https://github.com/poppy-team/ori-lang/blob/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/docs/spec/19-abi.md).
