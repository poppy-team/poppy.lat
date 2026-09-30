-- Pessoas silenciadas pela moderação por um tempo (não podem comentar).
CREATE TABLE user_mutes (
  user_id     TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
  muted_until INTEGER NOT NULL,             -- milissegundos desde 1970
  reason      TEXT NOT NULL DEFAULT '' CHECK (length(reason) <= 500),
  created_by  TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
