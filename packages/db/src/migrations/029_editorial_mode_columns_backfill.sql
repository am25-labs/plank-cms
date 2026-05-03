-- Backfill editorial workflow columns on all content type tables.

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
