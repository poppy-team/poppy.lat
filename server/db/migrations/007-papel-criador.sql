-- O papel de criador (quem escreve aulas e conteúdos) é uma permissão extra, não um novo valor de
-- user.role: a tabela user tem um CHECK nessa coluna e refazê-la apagaria, em cascata, sessões e perfis.
-- O papel "efetivo" é calculado na leitura: admin, depois criador (se houver a permissão), depois o papel base.
CREATE TABLE user_grants (
  user_id    TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  capability TEXT NOT NULL,
  granted_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, capability)
);
