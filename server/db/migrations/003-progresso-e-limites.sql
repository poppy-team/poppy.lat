-- Progresso por lição (o mesmo que hoje fica no navegador) e limite de requisições.
CREATE TABLE lesson_progress (
  user_id    TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  lesson_id  TEXT NOT NULL CHECK (length(lesson_id) BETWEEN 1 AND 200),
  status     TEXT NOT NULL CHECK (status IN ('started', 'completed')),
  code_tab   TEXT CHECK (code_tab IN ('Ori', 'Aipo')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, lesson_id)
);

-- Janela fixa: uma linha por chave (ação + pessoa ou IP) e por janela de tempo.
CREATE TABLE rate_limits (
  key          TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count        INTEGER NOT NULL
);
