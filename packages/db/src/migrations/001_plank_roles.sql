CREATE TABLE IF NOT EXISTS plank_roles (
  id          TEXT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  permissions JSONB NOT NULL DEFAULT '[]'
);
