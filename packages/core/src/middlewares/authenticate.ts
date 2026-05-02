import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { pool } from '@plank-cms/db'

interface JwtPayload {
  sub: string
  roleId: string
  sv?: number
}

function cookieValue(raw: string | undefined, key: string): string | null {
  if (!raw) return null
  const parts = raw.split(';')
  for (const part of parts) {
    const [k, ...rest] = part.trim().split('=')
    if (k === key) return decodeURIComponent(rest.join('='))
  }
  return null
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization
  const bearer = header?.startsWith('Bearer ') ? header.slice(7) : null
  const cookieToken = cookieValue(req.headers.cookie, 'plank_session')
  const token = bearer ?? cookieToken

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    const payload = jwt.verify(token, process.env.PLANK_JWT_SECRET!) as unknown as JwtPayload
    if (typeof payload.sv !== 'number') {
      res.status(401).json({ error: 'Invalid session token' })
      return
    }
    const { rows } = await pool.query<{ session_version: number }>(
      'SELECT session_version FROM plank_users WHERE id = $1',
      [payload.sub],
    )
    if (!rows[0] || rows[0].session_version !== payload.sv) {
      res.status(401).json({ error: 'Session has been revoked' })
      return
    }
    req.user = { id: payload.sub, roleId: payload.roleId }
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
