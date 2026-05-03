-- Rename User role to Contributor and ensure new default roles exist.
-- Keep existing IDs so user assignments remain intact.

UPDATE plank_roles
SET name = 'Contributor',
    permissions = '["content-types:read","entries:read","entries:write","entries:delete","media:read","media:write"]'::jsonb
WHERE name = 'User';

UPDATE plank_roles
SET permissions = '["content-types:read","entries:read","entries:write","entries:delete","media:read","media:write"]'::jsonb
WHERE name = 'Contributor';

INSERT INTO plank_roles (id, name, permissions)
SELECT md5(random()::text || clock_timestamp()::text),
       'Editor',
       '["content-types:read","entries:read","entries:write","entries:delete","media:read","media:write"]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM plank_roles WHERE name = 'Editor'
);

UPDATE plank_roles
SET permissions = '["content-types:read","entries:read","entries:write","entries:delete","media:read","media:write"]'::jsonb
WHERE name = 'Editor';
