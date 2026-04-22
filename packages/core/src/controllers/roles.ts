import type { Request, Response } from 'express'
import { pool, DEFAULT_ROLE_PERMISSIONS } from '@plank/db'
import { z } from 'zod'

type RoleRow = { id: string; name: string; permissions: string[] }

export async function listRoles(_req: Request, res: Response): Promise<void> {
  const { rows } = await pool.query<RoleRow>(
    'SELECT id, name, permissions FROM plank_roles ORDER BY name ASC',
  )
  res.json(rows)
}

export async function updateRole(req: Request, res: Response): Promise<void> {
  const { rows: target } = await pool.query<{ name: string }>(
    'SELECT name FROM plank_roles WHERE id = $1',
    [req.params.id],
  )
  if (!target[0]) { res.status(404).json({ error: 'Role not found' }); return }
  if (target[0].name === 'Super Admin') {
    res.status(403).json({ error: 'Super Admin permissions cannot be modified' }); return
  }

  const parsed = z.object({ permissions: z.array(z.string()) }).safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: 'Invalid permissions' }); return }

  const { rows } = await pool.query<RoleRow>(
    'UPDATE plank_roles SET permissions = $1 WHERE id = $2 RETURNING id, name, permissions',
    [JSON.stringify(parsed.data.permissions), req.params.id],
  )
  res.json(rows[0])
}

export async function resetRoles(_req: Request, res: Response): Promise<void> {
  for (const [name, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    if (name === 'Super Admin') continue
    await pool.query(
      'UPDATE plank_roles SET permissions = $1 WHERE name = $2',
      [JSON.stringify(permissions), name],
    )
  }
  const { rows } = await pool.query<RoleRow>(
    'SELECT id, name, permissions FROM plank_roles ORDER BY name ASC',
  )
  res.json(rows)
}
