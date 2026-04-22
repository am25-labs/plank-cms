import type { Request, Response } from 'express'
import { pool } from '@plank/db'
import { getProvider } from '../media/index.js'

export async function uploadMedia(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({ error: 'No file provided' })
    return
  }

  const provider = getProvider()
  const { url, key } = await provider.upload(req.file)

  const { rows } = await pool.query<{ id: number }>(
    `INSERT INTO plank_media (filename, url, provider_key, mime_type, size, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [req.file.originalname, url, key, req.file.mimetype, req.file.size, req.user!.id],
  )

  res.status(201).json({ id: rows[0].id, url, filename: req.file.originalname })
}
