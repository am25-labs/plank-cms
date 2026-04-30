import type { Request, Response, NextFunction } from 'express'
import { pool } from '@plank-cms/db'

export function authorize(permission: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { rows } = await pool.query<{ permissions: string[] }>(
      'SELECT permissions FROM plank_roles WHERE id = $1',
      [req.user!.roleId],
    )

    const permissions: string[] = rows[0]?.permissions ?? []
    if (permissions.includes('*') || permissions.includes(permission)) {
      next()
    } else {
      res.status(403).json({ error: 'Forbidden' })
    }
  }
}
