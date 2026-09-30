-- Perfil, foto, links, anotações, comentários, denúncias e registro de moderação.
CREATE TABLE profiles (
  user_id           TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
  handle            TEXT NOT NULL UNIQUE COLLATE NOCASE
                    CHECK (length(handle) BETWEEN 3 AND 24 AND handle NOT GLOB '*[^a-z0-9_-]*'),
  bio               TEXT NOT NULL DEFAULT '' CHECK (length(bio) <= 280),
  is_public         INTEGER NOT NULL DEFAULT 0 CHECK (is_public IN (0, 1)),
  show_in_rankings  INTEGER NOT NULL DEFAULT 0 CHECK (show_in_rankings IN (0, 1)),
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE notes (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  lesson_id    TEXT,
  exercise_id  TEXT,
  title        TEXT NOT NULL DEFAULT '' CHECK (length(title) <= 120),
  body_md      TEXT NOT NULL CHECK (length(body_md) <= 50000),
  version      INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX notes_by_user ON notes (user_id, updated_at DESC);
CREATE INDEX notes_by_lesson ON notes (user_id, lesson_id);

CREATE TABLE comments (
  id            TEXT PRIMARY KEY,
  target_type   TEXT NOT NULL CHECK (target_type IN ('lesson', 'exercise', 'topic')),
  target_id     TEXT NOT NULL,
  parent_id     TEXT REFERENCES comments(id) ON DELETE CASCADE,
  author_id     TEXT REFERENCES user(id) ON DELETE SET NULL,  -- NULL = conta removida
  body_md       TEXT NOT NULL CHECK (length(body_md) BETWEEN 1 AND 2000),
  status        TEXT NOT NULL DEFAULT 'visible'
                CHECK (status IN ('visible', 'hidden_by_moderator', 'deleted_by_author')),
  hidden_reason TEXT,
  is_pinned     INTEGER NOT NULL DEFAULT 0 CHECK (is_pinned IN (0, 1)),
  is_official   INTEGER NOT NULL DEFAULT 0 CHECK (is_official IN (0, 1)),
  edited_at     TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX comments_by_target ON comments (target_type, target_id, created_at);
CREATE INDEX comments_by_parent ON comments (parent_id);
CREATE INDEX comments_by_author ON comments (author_id, created_at DESC);

CREATE TABLE comment_reactions (
  comment_id  TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  emoji       TEXT NOT NULL CHECK (emoji IN ('👍', '❤️', '🎉', '💡', '🤔', '😅')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (comment_id, user_id, emoji)
);

CREATE TABLE reports (
  id           TEXT PRIMARY KEY,
  comment_id   TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  reporter_id  TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  reason       TEXT NOT NULL CHECK (reason IN ('spam', 'ofensivo', 'fora-do-tema', 'dados-pessoais', 'outro')),
  details      TEXT NOT NULL DEFAULT '' CHECK (length(details) <= 500),
  status       TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (comment_id, reporter_id)
);
CREATE INDEX reports_open ON reports (status, created_at);

-- Registro de moderação: só se acrescenta, nunca se altera nem se apaga.
CREATE TABLE moderation_log (
  id          INTEGER PRIMARY KEY,
  actor_id    TEXT NOT NULL,
  action      TEXT NOT NULL,   -- hide, restore, pin, official, mute, ban, role_change, delete
  target_type TEXT NOT NULL,
  target_id   TEXT NOT NULL,
  reason      TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TRIGGER moderation_log_no_update BEFORE UPDATE ON moderation_log
BEGIN SELECT RAISE(ABORT, 'moderation_log é somente de acréscimo'); END;
CREATE TRIGGER moderation_log_no_delete BEFORE DELETE ON moderation_log
BEGIN SELECT RAISE(ABORT, 'moderation_log é somente de acréscimo'); END;

-- Foto do perfil: o servidor guarda sempre uma imagem 256 x 256 em WebP, já recodificada.
CREATE TABLE profile_photos (
  user_id     TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
  photo_key   TEXT NOT NULL UNIQUE,   -- código aleatório usado no endereço da foto
  mime        TEXT NOT NULL DEFAULT 'image/webp' CHECK (mime = 'image/webp'),
  bytes       BLOB NOT NULL CHECK (length(bytes) BETWEEN 100 AND 65536),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Links do perfil: no máximo um por serviço. O valor é só o apelido do serviço (ou o https do site).
CREATE TABLE profile_links (
  user_id     TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  service     TEXT NOT NULL CHECK (service IN ('github', 'x', 'linkedin', 'instagram', 'youtube', 'email', 'site')),
  value       TEXT NOT NULL CHECK (length(value) BETWEEN 1 AND 200 AND value NOT GLOB '*[^!-~]*'),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, service)
);
