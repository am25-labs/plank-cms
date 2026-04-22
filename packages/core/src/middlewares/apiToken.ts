import type { Request, Response, NextFunction } from 'express'
import { pool } from '@plank/db'

export async function apiToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'API token required' })
    return
  }

  const token = header.slice(7)
  const { rows } = await pool.query(
    'SELECT id FROM plank_api_tokens WHERE token = $1',
    [token],
  )

  if (!rows[0]) {
    res.status(401).json({ error: 'Invalid API token' })
    return
  }

  next()
}
