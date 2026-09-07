import type { Request, Response } from 'express'
import { pool, createId } from '@plank-cms/db'
import { getProvider } from '../media/index.js'
import { moveMediaBundleKey, moveMediaKey } from '../media/paths.js'

type FolderRow = {
  id: string
  name: string
  parent_id: string | null
  created_at: Date
  item_count: number
}

type StoredMedia = {
  id: string
  provider_key: string
  folder_id: string
}

export async function listFolders(req: Request, res: Response): Promise<void> {
  const parentId = (req.query.parent_id as string) || null
  const includeAll = req.query.all === 'true'

  const { rows } = await pool.query<FolderRow>(
    `SELECT f.*,
      (
        (SELECT COUNT(*) FROM plank_folders sub WHERE sub.parent_id = f.id) +
        (SELECT COUNT(*) FROM plank_media m WHERE m.folder_id = f.id)
      )::int AS item_count
     FROM plank_folders f
     WHERE $2::boolean OR f.parent_id IS NOT DISTINCT FROM $1
     ORDER BY f.name ASC`,
    [parentId, includeAll],
  )

  res.json({ folders: rows })
}

export async function createFolder(req: Request, res: Response): Promise<void> {
  const { name, parent_id } = req.body as { name?: string; parent_id?: string | null }

  if (!name?.trim()) {
    res.status(400).json({ error: 'name is required' })
    return
  }

  if (parent_id) {
    const { rows } = await pool.query('SELECT id FROM plank_folders WHERE id = $1', [parent_id])
    if (!rows[0]) {
      res.status(404).json({ error: 'Parent folder not found' })
      return
    }
  }

  const id = createId()
  const { rows } = await pool.query<FolderRow>(
    `INSERT INTO plank_folders (id, name, parent_id) VALUES ($1, $2, $3) RETURNING *`,
    [id, name.trim(), parent_id ?? null],
  )

  res.status(201).json(rows[0])
}

export async function renameFolder(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id)
  const body = req.body as { name?: string; parent_id?: string | null }
  const hasName = typeof body.name === 'string'
  const hasParent = Object.prototype.hasOwnProperty.call(body, 'parent_id')

  if (!hasName && !hasParent) {
    res.status(400).json({ error: 'No changes provided' })
    return
  }

  if (hasName && !body.name?.trim()) {
    res.status(400).json({ error: 'name is required' })
    return
  }

  const { rows: currentRows } = await pool.query<Pick<FolderRow, 'id' | 'parent_id'>>(
    'SELECT id, parent_id FROM plank_folders WHERE id = $1',
    [id],
  )
  if (!currentRows[0]) {
    res.status(404).json({ error: 'Folder not found' })
    return
  }

  const parentId = hasParent ? body.parent_id ?? null : currentRows[0].parent_id
  const movingFolder = hasParent && parentId !== currentRows[0].parent_id
  if (parentId === id) {
    res.status(400).json({ error: 'A folder cannot be moved into itself' })
    return
  }

  if (parentId) {
    const { rows: parentRows } = await pool.query('SELECT id FROM plank_folders WHERE id = $1', [
      parentId,
    ])
    if (!parentRows[0]) {
      res.status(404).json({ error: 'Parent folder not found' })
      return
    }

    const { rows: descendantRows } = await pool.query(
      `WITH RECURSIVE descendants AS (
         SELECT id FROM plank_folders WHERE parent_id = $1
         UNION ALL
         SELECT f.id FROM plank_folders f JOIN descendants d ON f.parent_id = d.id
       )
       SELECT id FROM descendants WHERE id = $2`,
      [id, parentId],
    )
    if (descendantRows[0]) {
      res.status(400).json({ error: 'A folder cannot be moved into one of its descendants' })
      return
    }
  }

  const mediaMoves: Array<{ id: string; key: string; url: string }> = []
  if (movingFolder) {
    const [{ rows: treeRows }, { rows: allFolders }] = await Promise.all([
      pool.query<Pick<FolderRow, 'id' | 'parent_id'>>(
        `WITH RECURSIVE tree AS (
           SELECT id, parent_id FROM plank_folders WHERE id = $1
           UNION ALL
           SELECT f.id, f.parent_id FROM plank_folders f JOIN tree t ON f.parent_id = t.id
         )
         SELECT id, parent_id FROM tree`,
        [id],
      ),
      pool.query<Pick<FolderRow, 'id' | 'parent_id'>>('SELECT id, parent_id FROM plank_folders'),
    ])
    const treeIds = treeRows.map((folder) => folder.id)
    const { rows: mediaRows } = await pool.query<StoredMedia>(
      'SELECT id, provider_key, folder_id FROM plank_media WHERE folder_id = ANY($1::text[])',
      [treeIds],
    )
    const parents = new Map(allFolders.map((folder) => [folder.id, folder.parent_id]))
    parents.set(id, parentId)
    const prefixes = new Map<string, string>()
    const getPrefix = (folderId: string) => {
      const cached = prefixes.get(folderId)
      if (cached) return cached
      const ids: string[] = []
      const visited = new Set<string>()
      let currentId: string | null = folderId
      while (currentId && !visited.has(currentId)) {
        visited.add(currentId)
        ids.unshift(currentId)
        currentId = parents.get(currentId) ?? null
      }
      const prefix = ['media', ...ids].join('/')
      prefixes.set(folderId, prefix)
      return prefix
    }

    const provider = await getProvider()
    for (const media of mediaRows) {
      const isBundle = media.provider_key.toLowerCase().endsWith('.m3u8')
      const next = isBundle
        ? moveMediaBundleKey(media.provider_key, getPrefix(media.folder_id))
        : { key: moveMediaKey(media.provider_key, getPrefix(media.folder_id)) }
      if (media.provider_key !== next.key) {
        if (isBundle) {
          const bundle = next as ReturnType<typeof moveMediaBundleKey>
          await provider.movePrefix(
            media.provider_key.substring(0, media.provider_key.lastIndexOf('/')),
            bundle.prefix,
          )
        } else {
          await provider.move(media.provider_key, next.key)
        }
      }
      mediaMoves.push({ id: media.id, key: next.key, url: await provider.getUrl(next.key) })
    }
  }

  const updates: string[] = []
  const values: unknown[] = []
  if (hasName) {
    values.push(body.name!.trim())
    updates.push(`name = $${values.length}`)
  }
  if (hasParent) {
    values.push(parentId)
    updates.push(`parent_id = $${values.length}`)
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query<FolderRow>(
      `UPDATE plank_folders SET ${updates.join(', ')} WHERE id = $${values.length + 1} RETURNING *`,
      [...values, id],
    )
    await Promise.all(
      mediaMoves.map((media) =>
        client.query('UPDATE plank_media SET provider_key = $1, url = $2 WHERE id = $3', [
          media.key,
          media.url,
          media.id,
        ]),
      ),
    )
    await client.query('COMMIT')
    res.json(rows[0])
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function deleteFolder(req: Request, res: Response): Promise<void> {
  const { id } = req.params

  const { rows: folderRows } = await pool.query('SELECT id FROM plank_folders WHERE id = $1', [id])
  if (!folderRows[0]) {
    res.status(404).json({ error: 'Folder not found' })
    return
  }

  const { rows: subfolders } = await pool.query(
    'SELECT id FROM plank_folders WHERE parent_id = $1 LIMIT 1',
    [id],
  )
  const { rows: mediaItems } = await pool.query(
    'SELECT id FROM plank_media WHERE folder_id = $1 LIMIT 1',
    [id],
  )

  if (subfolders.length > 0 || mediaItems.length > 0) {
    res.status(409).json({ error: 'Folder is not empty. Move or delete its contents first.' })
    return
  }

  await pool.query('DELETE FROM plank_folders WHERE id = $1', [id])
  res.status(204).end()
}
