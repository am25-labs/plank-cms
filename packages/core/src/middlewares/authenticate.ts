import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

interface JwtPayload {
  sub: number
  roleId: number
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, process.env.PLANK_JWT_SECRET!) as unknown as JwtPayload
    req.user = { id: payload.sub, roleId: payload.roleId }
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
