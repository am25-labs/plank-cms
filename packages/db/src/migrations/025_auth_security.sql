ALTER TABLE plank_users
  ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS plank_auth_rate_limits (
  id         TEXT PRIMARY KEY,
  scope      VARCHAR(80) NOT NULL,
  rate_key   VARCHAR(255) NOT NULL,
  count      INTEGER NOT NULL DEFAULT 0,
  reset_at   TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (scope, rate_key)
);
