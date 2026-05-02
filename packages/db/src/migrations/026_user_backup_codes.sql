CREATE TABLE IF NOT EXISTS plank_user_backup_codes (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES plank_users(id) ON DELETE CASCADE,
  code_hash  VARCHAR(255) NOT NULL,
  used_at    TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plank_user_backup_codes_user_id
  ON plank_user_backup_codes(user_id);
