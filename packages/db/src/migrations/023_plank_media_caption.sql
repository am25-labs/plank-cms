ALTER TABLE plank_media
  ADD COLUMN caption TEXT;

UPDATE plank_media
SET alt = NULLIF(regexp_replace(filename, '\.[^.]+$', ''), '')
WHERE alt IS NULL OR btrim(alt) = '';
