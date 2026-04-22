CREATE TABLE IF NOT EXISTS plank_media (
  id           TEXT PRIMARY KEY,
  filename     VARCHAR(512) NOT NULL,
  url          TEXT NOT NULL,
  provider_key TEXT NOT NULL,
  mime_type    VARCHAR(255),
  size         INTEGER,
  uploaded_by  TEXT REFERENCES plank_users(id),
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);
