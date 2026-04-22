import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { pool, createId } from '@plank/db'
import { z, flattenError } from 'zod'

const CreateUserSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  roleId: z.string().min(1),
})

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
})

type UserRow = { id: string; email: string; role_id: string; created_at: Date }

export async function listUsers(_req: Request, res: Response): Promise<void> {
  const { rows } = await pool.query<UserRow>(
    'SELECT id, email, role_id, created_at FROM plank_users ORDER BY created_at DESC',
  )
  res.json(rows)
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const { rows } = await pool.query<UserRow>(
    'SELECT id, email, role_id, created_at FROM plank_users WHERE id = $1',
    [req.user!.id],
  )
  if (!rows[0]) { res.status(404).json({ error: 'User not found' }); return }
  res.json(rows[0])
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  const parsed = ChangePasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ errors: flattenError(parsed.error, (i) => i.message) })
    return
  }

  const { rows } = await pool.query<{ password: string }>(
    'SELECT password FROM plank_users WHERE id = $1',
    [req.user!.id],
  )
  if (!rows[0]) { res.status(404).json({ error: 'User not found' }); return }

  const valid = await bcrypt.compare(parsed.data.currentPassword, rows[0].password)
  if (!valid) { res.status(400).json({ error: 'Current password is incorrect' }); return }

  const hashed = await bcrypt.hash(parsed.data.newPassword, 12)
  await pool.query('UPDATE plank_users SET password = $1 WHERE id = $2', [hashed, req.user!.id])
  res.status(204).end()
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
