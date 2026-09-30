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

A função da API é gerada no build: `pnpm build` roda antes `pnpm build:api`, que junta `server/` em `server-dist/handler.mjs` (esbuild, dependências de fora ficam em `node_modules`). `api/index.js` só reexporta esse arquivo, e o `vercel.json` manda tudo o que começa com `/api/` para ele (um nome de arquivo com `[...route]` só casou com um trecho de caminho, e `/api/auth/...` dava 404). Não volte a apontar a função para um `.ts`: a Vercel não empacota os outros arquivos `.ts` de `server/` e a função cai com `ERR_MODULE_NOT_FOUND`.

1. **Turso:** criar o banco na nuvem com a CLI oficial (`~/.turso/turso db create poppy-aprender`; o comando `turso` de algumas instalações é o motor local `tursodb` e não conhece `db create`), pegar a URL (`turso db show poppy-aprender --url`) e um token só deste banco (`turso db tokens create poppy-aprender`).
2. **Migrações:** `TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... pnpm db:migrate` antes de cada publicação que traga um arquivo novo em `server/db/migrations/`. Elas nunca rodam sozinhas em produção. O script mostra em qual banco está rodando (por exemplo `poppy-aprender-….turso.io (remoto)`) e lista as migrações que o banco tem no fim; se faltarem as variáveis ele para, em vez de aplicar num arquivo local. Confira sempre que a última da lista é a mais nova de `server/db/migrations/`.
3. **Variáveis na Vercel** (Production e Preview, valores diferentes em cada um):

| Variável | Para quê |
| --- | --- |
| `SITE_URL` | Endereço público, com `https://`, sem barra no fim. Aqui é `https://www.poppy.lat`, porque o apex `poppy.lat` redireciona para o `www`. Serve para cookies, links do e-mail e a checagem de Origin. |
| `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` | O banco. |
| `AUTH_SECRET` | 32 caracteres ou mais, aleatório (`openssl rand -base64 32`). Diferente em cada ambiente. |
| `RESEND_API_KEY`, `MAIL_FROM` | Envio do link de login. O domínio do remetente precisa estar verificado na Resend: hoje é `noreply.poppy.lat`, com `MAIL_FROM=Poppy Team <login@noreply.poppy.lat>` e o rastreio de cliques desligado (ele reescreveria o link de login). |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | Opcional: liga o “Entrar com GitHub”. Callback: `https://poppy.lat/api/auth/callback/github`. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Opcional: liga o “Entrar com Google”. Redirecionamento autorizado: `https://www.poppy.lat/api/auth/callback/google` (o endereço canônico, com `www`). Passo a passo abaixo. |
| `VITE_ACCOUNTS` | `1` para ligar a interface de contas no build. |

4. **Primeiro admin:** entre uma vez pelo site e rode no Turso `UPDATE user SET role='admin' WHERE email='...'`. Depois disso, papéis se mudam pela página de Moderação.
**Estado atual (2026-09-30):** já estão no projeto `poppy-website` da Vercel, só em Production, `SITE_URL`, `MAIL_FROM`, `RESEND_API_KEY` (sensível, só envio) e `AUTH_SECRET` (sensível). Faltam `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` e, por último, `VITE_ACCOUNTS=1`. Não ligue `VITE_ACCOUNTS` antes do Turso, senão a interface aparece sem API. Os Previews ainda não têm variáveis: como o `SITE_URL` é fixo, um Preview precisaria do próprio endereço.

5. **Confirmar em um Preview antes do Production:** o formato do handler em `api/index.js` (exports `GET/POST/PUT/DELETE` com Hono, mais o rewrite de `/api/:path*`) só se confirma com um deploy real. Teste `/api/health`, `/api/auth/ok`, o login completo e o envio de foto.

## Ligar o “Entrar com Google” e o “Entrar com GitHub”

Cada botão só aparece na tela de entrada quando as duas variáveis do provedor existem na Vercel (Production). Sem elas, a tela segue só com o link por e-mail. As chaves entram só no painel da Vercel, nunca no chat nem no repositório.

**Google** (console.cloud.google.com):
1. Crie um projeto (ou use um existente) e abra **APIs e serviços › Tela de permissão OAuth**. Tipo de usuário: **Externo**. Preencha o nome do app (Poppy Team), o e-mail de suporte e os links `https://www.poppy.lat/privacidade` e `https://www.poppy.lat/termos`. Escopos: só `openid`, `email` e `profile`.
2. Em **Credenciais › Criar credenciais › ID do cliente OAuth**, tipo **Aplicativo da Web**. Em **Origens JavaScript autorizadas**: `https://www.poppy.lat`. Em **URIs de redirecionamento autorizados**: `https://www.poppy.lat/api/auth/callback/google`.
3. Copie o ID do cliente e a chave secreta para `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` na Vercel e faça um deploy novo.
4. Enquanto o app estiver em modo de teste, só os e-mails cadastrados como usuários de teste entram. Para abrir ao público, clique em **Publicar app** na tela de permissão (para os escopos acima, a verificação do Google não é exigida).

**GitHub** (github.com/settings/developers › New OAuth App): URL da página inicial `https://www.poppy.lat`; URL de callback `https://www.poppy.lat/api/auth/callback/github`. Copie o Client ID e gere um Client secret para `GITHUB_CLIENT_ID` e `GITHUB_CLIENT_SECRET`.

Quem já tem conta por e-mail e entra com Google é ligado à mesma conta, mas só quando o Google confirma que o e-mail é verificado. A foto do provedor nunca é guardada, e a confirmação de 18 anos e os Termos valem igual para qualquer forma de entrar.

## O que está e o que não está pronto

Pronto e testado (148 testes; fluxo completo no navegador): login por link (e GitHub, se configurado), perfil com foto e sete links, progresso sincronizado, anotações com editor visual e Markdown (baixar `.md` ou `.zip`), comentários com respostas, reações e denúncias, moderação com registro imutável, exportar e apagar a conta.

Ainda **não** feito:

- **Verificação em duas etapas (TOTP)** para Contribuidor e Admin. Hoje essas contas dependem só do link no e-mail, e ações graves (banir, mudar papel, apagar de vez, ler o registro) pedem login feito nos últimos 15 minutos.
- **CSP sem `unsafe-inline`**: o site já envia a `Content-Security-Policy` que bloqueia (fontes, scripts, imagens e API só do próprio site), mas ainda permite `unsafe-inline` em scripts e estilos por causa do VitePress. Tirar isso exige trocar os scripts inline por hashes.
- **Revisão jurídica** de idade mínima e privacidade (LGPD) antes de abrir cadastros. O texto de `/aprender/regras` é um resumo honesto do que o sistema faz, não um parecer.
- Ranking, medalhas e micro fórum: só a base (tabelas e regras) existe.
- Preferências de leitura ainda ficam só no navegador.
