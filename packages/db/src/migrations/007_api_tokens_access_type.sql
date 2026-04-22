ALTER TABLE plank_api_tokens
  ADD COLUMN IF NOT EXISTS access_type VARCHAR(20) NOT NULL DEFAULT 'read-only';
