---
title: "Cookbook"
description: "Recipes for small and medium projects, in valid S3 code."
project: ori
category: guides
locale: en
sourcePath: "docs/guides/cookbook.md"
sourceBlob: "4059814082934e4c1bc3d837497b1f58cc1a9c9a"
revision: "42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f"
license: "MIT"
---
::: info Cópia estática
Copiado de `docs/guides/cookbook.md` em [https://github.com/poppy-team/ori-lang](https://github.com/poppy-team/ori-lang) (MIT).
Fixado na revisão `42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f`, blob `4059814082934e4c1bc3d837497b1f58cc1a9c9a`.
O repositório de origem permanece canônico; esta cópia não é atualizada automaticamente.
:::
# Cookbook — small and medium projects

> Status: practical recipes for Ori **S3 + inference B / workspace 0.3.8-dev**
> **Portuguese:** [cookbook.pt-BR.md](/ori/docs/guides/manual/cookbook)

## CLI that reads arguments

```ori
module app.main

import ori.args as args
import ori.io as io

main()
    const name = args.get_or(1, "Ori")
    io.println("hello, " + name)
end
```

```bash
ori run main.orl
```

## Local config text

```ori
module app.main

import ori.config as config
import ori.io as io

main()
    const text: string = config.read_text_or("app.conf", "mode=dev")
    io.println(text)
end
```

Use `config.read_json(path)` for structured JSON (`result` / domain aliases).

## Files

```ori
module app.main

import ori.fs as fs
import ori.io as io

main()
    match fs.write_text("out.txt", "done")
        case ok(_):
            match fs.read_text("out.txt")
                case ok(value):
                    io.println(value)
                case err(message):
                    io.eprintln(message)
            end
        case err(message):
            io.eprintln(message)
    end
end
```

Helpers: `fs.read_text_or`, `fs.write_text_result`, domain aliases
`TextResult` / `IoResult` via `import ori.fs (TextResult, …)`.

## Measure time

```ori
module app.main

import ori.io as io
import ori.time as time

main()
    const start: time.Instant = time.instant_now()
    time.sleep_duration(time.duration_millis(10))
    const elapsed: time.Duration = time.elapsed_since(start)
    io.println(string(time.duration_to_millis(elapsed)))
end
```

## Local package

In the app `ori.proj`:

```ini
[dependencies]
demo.math = { path = "../math", version = "0.1.0" }
```

```ori
import demo.math (double)
```

```bash
ori check main.orl
ori test main.orl
```

## Documentation export

```bash
ori doc file main.orl --format html --out docs/api/index.html
ori doc check .
```

Use `.oridoc` sidecars for long descriptions; keep inline comments short.

## HTTP (STDLIB-2)

```ori
module app.main

import ori.io as io
import ori.net.http as http

main()
    match http.get_plain("127.0.0.1", 8080, "/", 3000)
        case ok(resp):
            io.println(string(resp.status))
            io.println(resp.body)
        case err(msg):
            io.eprintln(msg)
    end
end
```

TLS: `http.get_tls("example.com", "/", 5000)` (needs network; runtime rustls + ring).  
Full sample: [`examples/http_get`](https://github.com/poppy-team/ori-lang/blob/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/examples/http_get/).  
Also: `build_request`, `parse_response` for manual control.

## File streams (STDLIB-3)

```ori
import ori.io as io

main()
    match io.open_output("out.txt")
        case ok(out):
            match io.write_text(out, "hi")
                case ok(_):
                    match io.flush(out)
                        case ok(_):
                            io.close_output(out)
                        case err(_):
                    end
                case err(_):
            end
        case err(_):
    end
    -- or: using out: ori.io.Output = out_handle  (dispose closes the stream)
end
```

## Pipe and local inference

```ori
module app.main

import ori.string as str
import ori.io as io

main()
    const cleaned = "  hi  " |> str.trim
    io.println(cleaned)
end
```

Pipe `|>` is typed as a normal call. Local `const cleaned = …` may omit the
type when the checker knows the result (option B).

---

See also: [Language tour](/en/ori/docs/guides/getting-started/tour) · [First project](/en/ori/docs/guides/getting-started/first-project) ·
[Errors](/en/ori/docs/guides/manual/errors-null-void) · [Examples](https://github.com/poppy-team/ori-lang/blob/42e1817227fbc96e8e4a4a85fac78b3fec0a0e0f/examples/)
