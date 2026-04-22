import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from '@plank/db'
import { z } from 'zod'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

type UserRow = { id: number; password: string; role_id: number }
type CountRow = { count: string }
type RoleRow = { id: number }
type InsertedUser = { id: number }

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = LoginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.flatten() })
    return
  }

  const { email, password } = parsed.data
  const { rows } = await pool.query<UserRow>(
    'SELECT id, password, role_id FROM plank_users WHERE email = $1',
    [email],
  )

  const user = rows[0]
  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const token = jwt.sign(
    { sub: user.id, roleId: user.role_id },
    process.env.PLANK_JWT_SECRET!,
    { expiresIn: '7d' },
  )

  res.json({ token })
}

export async function register(req: Request, res: Response): Promise<void> {
  const { rows: countRows } = await pool.query<CountRow>('SELECT COUNT(*) as count FROM plank_users')
  if (parseInt(countRows[0].count) > 0) {
    res.status(403).json({ error: 'Registration is closed. Use the admin panel to manage users.' })
    return
  }

  const parsed = RegisterSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.flatten() })
    return
  }

  const { email, password } = parsed.data
  const hashed = await bcrypt.hash(password, 12)

  const { rows: roleRows } = await pool.query<RoleRow>(
    'SELECT id FROM plank_roles WHERE name = $1',
    ['admin'],
  )

  const { rows } = await pool.query<InsertedUser>(
    'INSERT INTO plank_users (email, password, role_id) VALUES ($1, $2, $3) RETURNING id',
    [email, hashed, roleRows[0].id],
  )

  res.status(201).json({ id: rows[0].id, email })
}
