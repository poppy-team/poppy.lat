-- Gestão dos avisos: marcar um aviso como lido, excluir um aviso, excluir todos.
-- O aviso é a resposta de alguém a um comentário seu; o id do aviso é o id da resposta.
CREATE TABLE notification_state (
  user_id    TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  comment_id TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  is_read    INTEGER NOT NULL DEFAULT 0 CHECK (is_read IN (0, 1)),
  is_deleted INTEGER NOT NULL DEFAULT 0 CHECK (is_deleted IN (0, 1)),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, comment_id)
);

-- "Excluir todos": o que foi escrito até este momento deixa de aparecer (NULL = nada excluído).
ALTER TABLE profiles ADD COLUMN notifications_cleared_at TEXT;
