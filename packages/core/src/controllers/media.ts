import type { Request, Response } from 'express'
import { pool, createId } from '@plank/db'
import { getProvider } from '../media/index.js'

export async function uploadMedia(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({ error: 'No file provided' })
    return
  }

  const provider = getProvider()
  const { url, key } = await provider.upload(req.file)
  const id = createId()

  await pool.query(
    `INSERT INTO plank_media (id, filename, url, provider_key, mime_type, size, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, req.file.originalname, url, key, req.file.mimetype, req.file.size, req.user!.id],
  )

  res.status(201).json({ id, url, filename: req.file.originalname })
}
