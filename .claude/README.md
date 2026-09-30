# Skills e agents do projeto

Copiados de `poppy-team/prumo` (`src/prumo/resources/workforce`, commit e91694d, licença MIT) para a revisão de segurança, dados pessoais e acessibilidade do poppy.lat.

- `skills/`: segurança web e de dados (web-security, auth-security, api-security, security-authz-matrix, security-saas-isolation, threat-modeling, security-threat-model, observability, database-review, lang-sql, secrets-security, secure-coding, supply-chain-security, dependency-management, prumo-security-review) e acessibilidade (accessibility, keyboard-accessibility, contrast).
- `agents/`: security-reviewer e accessibility-reviewer.

`security-review` virou `prumo-security-review` para não colidir com o comando `/security-review` do Claude Code. `contrast` e `database-review` ganharam o cabeçalho `name`/`description` (vindo do `manifest.json`), que o Claude Code exige.

Para atualizar, copie de novo a partir do prumo e reaplique essas duas mudanças.
