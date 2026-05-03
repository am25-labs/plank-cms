-- Editorial Mode base: viewer role, user enabled flag and review workflow columns.

INSERT INTO plank_roles (id, name, permissions)
SELECT md5(random()::text || clock_timestamp()::text),
       'Viewer',
       '["content-types:read","entries:read","media:read"]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM plank_roles WHERE name = 'Viewer'
);

UPDATE plank_roles
SET permissions = '["content-types:read","entries:read","media:read"]'::jsonb
WHERE name = 'Viewer';

INSERT INTO plank_settings (namespace, key, value)
VALUES ('general', 'editorial_mode', 'false')
ON CONFLICT (namespace, key) DO NOTHING;

ALTER TABLE plank_users
  ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT TRUE;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT table_name FROM plank_content_types LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = tbl AND column_name = 'editor_id'
    ) THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN editor_id TEXT REFERENCES plank_users(id) ON DELETE SET NULL', tbl);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = tbl AND column_name = 'review_locked_by_editor'
    ) THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN review_locked_by_editor BOOLEAN NOT NULL DEFAULT FALSE', tbl);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = tbl AND column_name = 'review_rejected'
    ) THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN review_rejected BOOLEAN NOT NULL DEFAULT FALSE', tbl);
    END IF;
  END LOOP;
END;
$$;
