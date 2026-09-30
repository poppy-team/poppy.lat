-- Avisos de respostas: quando a pessoa viu a lista pela última vez (NULL = desde que criou o perfil).
ALTER TABLE profiles ADD COLUMN notifications_seen_at TEXT;
