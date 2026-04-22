import type { Request, Response } from 'express'
import { randomBytes } from 'node:crypto'
import { pool, createId } from '@plank/db'
import { z, flattenError } from 'zod'

const CreateTokenSchema = z.object({
  name: z.string().min(1),
})

type TokenRow = { id: string; name: string; created_at: Date }

export async function listApiTokens(_req: Request, res: Response): Promise<void> {
  const { rows } = await pool.query<TokenRow>(
    'SELECT id, name, created_at FROM plank_api_tokens ORDER BY created_at DESC',
  )
  res.json(rows)
}

export async function createApiToken(req: Request, res: Response): Promise<void> {
  const parsed = CreateTokenSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ errors: flattenError(parsed.error, (i) => i.message) })
    return
  }

  const id = createId()
  const token = `plank_${randomBytes(32).toString('hex')}`

  await pool.query(
    'INSERT INTO plank_api_tokens (id, name, token, created_by) VALUES ($1, $2, $3, $4)',
    [id, parsed.data.name, token, req.user!.id],
  )

  // Token is returned once and never shown again
  res.status(201).json({ id, name: parsed.data.name, token })
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
