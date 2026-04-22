import type { Request, Response } from 'express'
import { randomBytes } from 'node:crypto'
import { pool } from '@plank/db'
import { z } from 'zod'

const CreateTokenSchema = z.object({
  name: z.string().min(1),
})

type TokenRow = { id: number; name: string; token: string; created_at: Date }

export async function listApiTokens(_req: Request, res: Response): Promise<void> {
  const { rows } = await pool.query<Omit<TokenRow, 'token'>>(
    'SELECT id, name, created_at FROM plank_api_tokens ORDER BY created_at DESC',
  )
  res.json(rows)
}

export async function createApiToken(req: Request, res: Response): Promise<void> {
  const parsed = CreateTokenSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.flatten() })
    return
  }

  const token = `plank_${randomBytes(32).toString('hex')}`
  const { rows } = await pool.query<{ id: number }>(
    'INSERT INTO plank_api_tokens (name, token, created_by) VALUES ($1, $2, $3) RETURNING id',
    [parsed.data.name, token, req.user!.id],
  )

  // Token is returned once and never shown again
  res.status(201).json({ id: rows[0].id, name: parsed.data.name, token })
}

export async function deleteApiToken(req: Request, res: Response): Promise<void> {
  const { rowCount } = await pool.query(
    'DELETE FROM plank_api_tokens WHERE id = $1',
    [req.params.id],
  )

  if (!rowCount) {
    res.status(404).json({ error: 'API token not found' })
    return
  }
  res.status(204).end()
}
