CREATE TABLE IF NOT EXISTS plank_roles (
  id      SERIAL PRIMARY KEY,
  name    VARCHAR(100) NOT NULL UNIQUE,
  permissions JSONB NOT NULL DEFAULT '[]'
);

INSERT INTO plank_roles (name, permissions)
VALUES ('admin', '["*"]')
ON CONFLICT (name) DO NOTHING;
