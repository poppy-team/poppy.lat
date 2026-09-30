# Aprender: contas, anotações e comentários (como rodar e como publicar)

Tudo o que é de conta fica **desligado** até a variável `VITE_ACCOUNTS=1` estar no build. Sem ela o site é o mesmo site estático de antes: sem menu de conta, sem painel de anotações, sem comentários.

## Rodar em casa

```bash
pnpm install
pnpm api                                  # API em http://127.0.0.1:8787, banco em local.db
VITE_ACCOUNTS=1 pnpm dev --host 127.0.0.1 # site em http://127.0.0.1:5173, /api vai para a API
```

- O e-mail de login **aparece no terminal da API** (não é enviado de verdade). Copie o link e abra no navegador.
- `SITE_URL` precisa ser o endereço em que você abre o site (o padrão é `http://localhost:5173`). Se abrir por `127.0.0.1`, rode a API com `SITE_URL=http://127.0.0.1:5173 pnpm api`.
- Para virar Contribuidor ou Admin em casa: `sqlite3 local.db "UPDATE user SET role='admin' WHERE email='voce@exemplo.com'"`.
- Testes: `pnpm test` (o servidor usa um banco em memória; nada toca o `local.db`).

## Publicar (Vercel + Turso)

1. **Turso:** criar o banco (`turso db create poppy-aprender`), pegar a URL (`turso db show poppy-aprender --url`) e um token só deste banco (`turso db tokens create poppy-aprender`).
2. **Migrações:** `TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... pnpm db:migrate` antes de cada publicação que traga um arquivo novo em `server/db/migrations/`. Elas nunca rodam sozinhas em produção.
3. **Variáveis na Vercel** (Production e Preview, valores diferentes em cada um):

| Variável | Para quê |
| --- | --- |
| `SITE_URL` | Endereço público, com `https://`, sem barra no fim (`https://poppy.lat`). Serve para cookies, links do e-mail e a checagem de Origin. |
| `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` | O banco. |
| `AUTH_SECRET` | 32 caracteres ou mais, aleatório (`openssl rand -base64 32`). Diferente em cada ambiente. |
| `RESEND_API_KEY`, `MAIL_FROM` | Envio do link de login. O domínio do remetente precisa estar verificado na Resend. |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | Opcional: liga o “Entrar com GitHub”. Callback: `https://poppy.lat/api/auth/callback/github`. |
| `VITE_ACCOUNTS` | `1` para ligar a interface de contas no build. |

4. **Primeiro admin:** entre uma vez pelo site e rode no Turso `UPDATE user SET role='admin' WHERE email='...'`. Depois disso, papéis se mudam pela página de Moderação.
5. **Confirmar em um Preview antes do Production:** o formato do handler em `api/[...route].ts` (exports `GET/POST/PUT/DELETE` com Hono) segue a documentação da Vercel, mas só um deploy real confirma. Teste `/api/health`, o login completo e o envio de foto.

## O que está e o que não está pronto

Pronto e testado (148 testes; fluxo completo no navegador): login por link (e GitHub, se configurado), perfil com foto e sete links, progresso sincronizado, anotações com editor visual e Markdown (baixar `.md` ou `.zip`), comentários com respostas, reações e denúncias, moderação com registro imutável, exportar e apagar a conta.

Ainda **não** feito:

- **Verificação em duas etapas (TOTP)** para Contribuidor e Admin. Hoje essas contas dependem só do link no e-mail, e ações graves (banir, mudar papel, apagar de vez, ler o registro) pedem login feito nos últimos 15 minutos.
- **Política de CSP que bloqueia**: o site envia `Content-Security-Policy-Report-Only`. Passar a bloquear exige trocar os scripts inline do VitePress por hashes.
- **Revisão jurídica** de idade mínima e privacidade (LGPD) antes de abrir cadastros. O texto de `/aprender/regras` é um resumo honesto do que o sistema faz, não um parecer.
- Ranking, medalhas e micro fórum: só a base (tabelas e regras) existe.
- Preferências de leitura ainda ficam só no navegador.
