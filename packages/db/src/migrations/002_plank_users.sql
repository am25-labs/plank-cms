CREATE TABLE IF NOT EXISTS plank_users (
  id         SERIAL PRIMARY KEY,
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  role_id    INTEGER NOT NULL REFERENCES plank_roles(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
