import { pool } from '@plank-cms/db'

type FolderPathRow = {
  id: string
  parent_id: string | null
}

export async function getMediaFolderPrefix(folderId: string | null): Promise<string> {
  if (!folderId) return 'media'

  const { rows } = await pool.query<FolderPathRow>(
    `WITH RECURSIVE ancestors AS (
       SELECT id, parent_id, 0 AS depth FROM plank_folders WHERE id = $1
       UNION ALL
       SELECT f.id, f.parent_id, a.depth + 1
       FROM plank_folders f
       JOIN ancestors a ON f.id = a.parent_id
     )
     SELECT id, parent_id FROM ancestors ORDER BY depth DESC`,
    [folderId],
  )

  if (rows.length === 0) throw new Error('Folder not found')
  return ['media', ...rows.map((row) => row.id)].join('/')
}

export function moveMediaKey(key: string, prefix: string): string {
  const segments = key.split('/')
  const filename = segments[segments.length - 1]
  if (!filename) throw new Error('Invalid media key')
  const mediaIndex = segments.lastIndexOf('media')
  const base = mediaIndex >= 0 ? segments.slice(0, mediaIndex) : []
  return [...base, ...prefix.split('/'), filename].join('/')
}

export function moveMediaBundleKey(key: string, prefix: string): { prefix: string; key: string } {
  const segments = key.split('/')
  if (segments.length < 2) throw new Error('Invalid media bundle key')
  const bundleId = segments[segments.length - 2]
  const filename = segments[segments.length - 1]
  const mediaIndex = segments.lastIndexOf('media')
  const base = mediaIndex >= 0 ? segments.slice(0, mediaIndex) : []
  const bundlePrefix = [...base, ...prefix.split('/'), bundleId].join('/')
  return { prefix: bundlePrefix, key: `${bundlePrefix}/${filename}` }
}
