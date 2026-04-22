CREATE TABLE IF NOT EXISTS plank_api_tokens (
  id         TEXT PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  token      VARCHAR(512) NOT NULL UNIQUE,
  created_by TEXT NOT NULL REFERENCES plank_users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
