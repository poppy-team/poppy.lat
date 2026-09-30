-- Tabelas de login do Better Auth (com o plugin admin: papel e banimento).
-- Datas em milissegundos desde 1970, como o Better Auth grava com o Drizzle.
CREATE TABLE user (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL UNIQUE,
  email_verified INTEGER NOT NULL DEFAULT 0,
  image          TEXT,                       -- nunca é mostrado: a foto do site fica em profile_photos
  created_at     INTEGER NOT NULL,
  updated_at     INTEGER NOT NULL,
  role           TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'contributor', 'admin')),
  banned         INTEGER DEFAULT 0,
  ban_reason     TEXT,
  ban_expires    INTEGER
);

CREATE TABLE session (
  id              TEXT PRIMARY KEY,
  expires_at      INTEGER NOT NULL,
  token           TEXT NOT NULL UNIQUE,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL,
  ip_address      TEXT,
  user_agent      TEXT,
  user_id         TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  impersonated_by TEXT
);
CREATE INDEX session_user_id ON session (user_id);

CREATE TABLE account (
  id                       TEXT PRIMARY KEY,
  account_id               TEXT NOT NULL,
  provider_id              TEXT NOT NULL,
  user_id                  TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  access_token             TEXT,
  refresh_token            TEXT,
  id_token                 TEXT,
  access_token_expires_at  INTEGER,
  refresh_token_expires_at INTEGER,
  scope                    TEXT,
  password                 TEXT,
  created_at               INTEGER NOT NULL,
  updated_at               INTEGER NOT NULL
);
CREATE INDEX account_user_id ON account (user_id);

CREATE TABLE verification (
  id         TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value      TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX verification_identifier ON verification (identifier);
