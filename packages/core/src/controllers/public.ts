import type { RequestHandler } from 'express'
import { pool } from '@plank/db'
import { findContentTypeBySlug, assertSafeIdentifier } from '@plank/schema'

type SlugParam = RequestHandler<{ slug: string }>
type SlugIdParam = RequestHandler<{ slug: string; id: string }>

export const listPublicEntries: SlugParam = async (req, res) => {
  const ct = await findContentTypeBySlug(req.params.slug)
  if (!ct) { res.status(404).json({ error: 'Not found' }); return }

  assertSafeIdentifier(ct.tableName)
  const page = Math.max(1, parseInt(String(req.query.page ?? 1)))
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? 20))))
  const offset = (page - 1) * limit

  const knownFields = new Set(ct.fields.map((f) => f.name))
  const filterClauses: string[] = []
  const filterValues: unknown[] = []

  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'page' || key === 'limit') continue
    if (knownFields.has(key)) {
      assertSafeIdentifier(key)
      filterClauses.push(`${key} = $${filterValues.length + 1}`)
      filterValues.push(value)
    }
  }

  const where = filterClauses.length > 0 ? `WHERE ${filterClauses.join(' AND ')}` : ''
  const limitParam = filterValues.length + 1
  const offsetParam = filterValues.length + 2

  const [{ rows }, { rows: countRows }] = await Promise.all([
    pool.query(
      `SELECT * FROM ${ct.tableName} ${where} ORDER BY created_at DESC LIMIT $${limitParam} OFFSET $${offsetParam}`,
      [...filterValues, limit, offset],
    ),
    pool.query(`SELECT COUNT(*) as count FROM ${ct.tableName} ${where}`, filterValues),
  ])

  res.json({ data: rows, total: parseInt(countRows[0].count), page, limit })
}

export const getPublicEntry: SlugIdParam = async (req, res) => {
  const ct = await findContentTypeBySlug(req.params.slug)
  if (!ct) { res.status(404).json({ error: 'Not found' }); return }

  assertSafeIdentifier(ct.tableName)
  const { rows } = await pool.query(
    `SELECT * FROM ${ct.tableName} WHERE id = $1`,
    [req.params.id],
  )

  if (!rows[0]) { res.status(404).json({ error: 'Not found' }); return }
  res.json(rows[0])
}
