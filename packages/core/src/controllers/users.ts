import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { pool } from '@plank/db'
import { z } from 'zod'

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  roleId: z.number().int().positive(),
})

type UserRow = { id: number; email: string; role_id: number; created_at: Date }

export async function listUsers(_req: Request, res: Response): Promise<void> {
  const { rows } = await pool.query<UserRow>(
    'SELECT id, email, role_id, created_at FROM plank_users ORDER BY created_at DESC',
  )
  res.json(rows)
}

export async function createUser(req: Request, res: Response): Promise<void> {
  const parsed = CreateUserSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.flatten() })
    return
  }

  const { email, password, roleId } = parsed.data
  const hashed = await bcrypt.hash(password, 12)

  const { rows } = await pool.query<{ id: number }>(
    'INSERT INTO plank_users (email, password, role_id) VALUES ($1, $2, $3) RETURNING id',
    [email, hashed, roleId],
  )
  res.status(201).json({ id: rows[0].id, email, roleId })
}
