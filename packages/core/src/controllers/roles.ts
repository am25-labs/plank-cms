import type { Request, Response } from 'express'
import { pool } from '@plank/db'

type RoleRow = { id: string; name: string }

export async function listRoles(_req: Request, res: Response): Promise<void> {
  const { rows } = await pool.query<RoleRow>(
    'SELECT id, name FROM plank_roles ORDER BY name ASC',
  )
  res.json(rows)
}
