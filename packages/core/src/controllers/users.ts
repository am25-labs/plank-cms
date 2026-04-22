import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { pool, createId } from '@plank/db'
import { z, flattenError } from 'zod'

const CreateUserSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  roleId: z.string().min(1),
})

type UserRow = { id: string; email: string; role_id: string; created_at: Date }

export async function listUsers(_req: Request, res: Response): Promise<void> {
  const { rows } = await pool.query<UserRow>(
    'SELECT id, email, role_id, created_at FROM plank_users ORDER BY created_at DESC',
  )
  res.json(rows)
}

export async function createUser(req: Request, res: Response): Promise<void> {
  const parsed = CreateUserSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ errors: flattenError(parsed.error, (i) => i.message) })
    return
  }

  const { email, password, roleId } = parsed.data
  const hashed = await bcrypt.hash(password, 12)
  const id = createId()

  await pool.query(
    'INSERT INTO plank_users (id, email, password, role_id) VALUES ($1, $2, $3, $4)',
    [id, email, hashed, roleId],
  )
  res.status(201).json({ id, email, roleId })
}
