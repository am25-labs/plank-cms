import type { RequestHandler } from 'express'
import { pool, createId } from '@plank-cms/db'
import {
  findContentTypeBySlug,
  validate,
  assertSafeIdentifier,
  isVirtualRelation,
  quoteIdentifier,
} from '@plank-cms/schema'
import type { FieldDefinition } from '@plank-cms/schema'
import { getProvider } from '../media/index.js'
import { triggerWebhooks } from './webhooks.js'

type Locale = string | undefined
type LocalizedValues = Record<string, Record<string, unknown>> & {
  _meta?: { enabled?: boolean; primary?: string }
}

function resolveLocalizedRow(
  row: Record<string, unknown>,
  ct: { fields: FieldDefinition[] },
  locale: Locale,
  fallbacks: string[] = [],
) {
  const localized: LocalizedValues =
    row.localized && typeof row.localized === 'object' ? (row.localized as LocalizedValues) : {}
  const resolved: Record<string, unknown> = { ...row }
  const localizableTypes = new Set(['string', 'text', 'richtext', 'uid'])
  for (const f of ct.fields) {
    if (!localizableTypes.has(f.type)) continue
    let val: unknown = undefined
    if (locale && localized[locale] && localized[locale][f.name] !== undefined) {
      val = localized[locale][f.name]
    } else {
      for (const fb of fallbacks) {
        if (localized[fb] && localized[fb][f.name] !== undefined) {
          val = localized[fb][f.name]
          break
        }
      }
    }
    if (val !== undefined) resolved[f.name] = val
  }
  return resolved
}

function junctionTableName(sourceTable: string, fieldName: string): string {
  return `_rel_${sourceTable}_${fieldName}`
}

function normalizeNavigationItems(value: unknown): unknown {
  if (!Array.isArray(value)) return value
  return value.map((item) => {
    if (typeof item !== 'object' || item === null) return item
    const raw = item as Record<string, unknown>
    const normalized: Record<string, unknown> = {
      label: raw.label,
      href: raw.href,
    }
    if (Array.isArray(raw.items)) {
      const normalizedChildren = normalizeNavigationItems(raw.items)
      if (Array.isArray(normalizedChildren) && normalizedChildren.length > 0) {
        normalized.items = normalizedChildren
      }
    } else if (raw.items !== undefined) {
      normalized.items = raw.items
    }
    for (const [key, val] of Object.entries(raw)) {
      if (key === 'label' || key === 'href' || key === 'items') continue
      normalized[key] = val
    }
    return normalized
  })
}

function normalizeNavigationFields(
  row: Record<string, unknown>,
  fields: import('@plank-cms/schema').FieldDefinition[],
): Record<string, unknown> {
  const out = { ...row }
  for (const field of fields) {
    if (field.type !== 'navigation') continue
    out[field.name] = normalizeNavigationItems(out[field.name])
  }
  return out
}

async function syncManyToMany(
  entryId: string,
  tableName: string,
  field: FieldDefinition,
  targetIds: string[],
): Promise<void> {
  const jt = junctionTableName(tableName, field.name)
  await pool.query(`DELETE FROM ${quoteIdentifier(jt)} WHERE source_id = $1`, [entryId])
  if (targetIds.length === 0) return
  const placeholders = targetIds.map((_, i) => `($1, $${i + 2})`).join(', ')
  await pool.query(
    `INSERT INTO ${quoteIdentifier(jt)} (source_id, target_id) VALUES ${placeholders} ON CONFLICT DO NOTHING`,
    [entryId, ...targetIds],
  )
}

type SlugParam = RequestHandler<{ slug: string }>
type SlugIdParam = RequestHandler<{ slug: string; id: string }>

async function isUserRole(roleId: string | undefined): Promise<boolean> {
  if (!roleId) return false
  const { rows } = await pool.query<{ name: string }>('SELECT name FROM plank_roles WHERE id = $1', [roleId])
  return rows[0]?.name?.toLowerCase() === 'user'
}

export const listEntries: SlugParam = async (req, res) => {
  const ct = await findContentTypeBySlug(req.params.slug)
  if (!ct) {
    res.status(404).json({ error: 'Content type not found' })
    return
  }

  assertSafeIdentifier(ct.tableName)
  const quotedTableName = quoteIdentifier(ct.tableName)
  const isUser = await isUserRole(req.user?.roleId)
  const page = Math.max(1, parseInt(String(req.query.page ?? 1)))
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? 20))))
  const offset = (page - 1) * limit

  const allowedSort = ['created_at', 'updated_at', 'published_at', ...ct.fields.map((f) => f.name)]
  const sortField = allowedSort.includes(String(req.query.sort ?? ''))
    ? String(req.query.sort)
    : 'created_at'
  const sortDir = req.query.order === 'asc' ? 'ASC' : 'DESC'
  assertSafeIdentifier(sortField)
  const quotedSortField = quoteIdentifier(sortField)

  const locale = req.query.locale ? String(req.query.locale) : undefined
  const fallbacks = req.query.fallback ? String(req.query.fallback).split(',') : []

  const ownCollectionOnly = isUser && ct.kind === 'collection'
  const whereClause = ownCollectionOnly ? 'WHERE e.created_by = $3' : ''
  const countWhereClause = ownCollectionOnly ? 'WHERE created_by = $1' : ''
  const listValues = ownCollectionOnly ? [limit, offset, req.user?.id ?? null] : [limit, offset]
  const countValues = ownCollectionOnly ? [req.user?.id ?? null] : []
  const [{ rows }, { rows: countRows }] = await Promise.all([
    pool.query(
      `SELECT e.*, u.first_name AS _author_first_name, u.last_name AS _author_last_name, u.avatar_url AS _author_avatar_url
       FROM ${quotedTableName} e
       LEFT JOIN plank_users u ON u.id = e.created_by
       ${whereClause}
       ORDER BY e.${quotedSortField} ${sortDir}
       LIMIT $1 OFFSET $2`,
      listValues,
    ),
    pool.query(`SELECT COUNT(*) as count FROM ${quotedTableName} ${countWhereClause}`, countValues),
  ])

  const provider = await getProvider()
  function entryMatchesLocale(row: Record<string, unknown>, locale?: string) {
    if (!locale) return true
    const localized: LocalizedValues =
      row.localized && typeof row.localized === 'object' ? (row.localized as LocalizedValues) : {}
    const locales = Object.keys(localized).filter((k) => !k.startsWith('_'))
    const meta = localized._meta ?? {}
    const enabled = meta.enabled ?? locales.length > 0
    const primary: string | undefined = meta.primary
    if (enabled) {
      return Boolean(localized[locale]) || primary === locale
    }
    return primary === locale
  }

  const filtered = rows.filter((r) => entryMatchesLocale(r, locale))

  const data = await Promise.all(
    filtered.map(async (row) => {
      const mmIds = await loadManyToManyIds(row.id, ct.tableName, ct.fields)
      const resolved = resolveLocalizedRow(row, ct, locale, fallbacks)
      const key = resolved._author_avatar_url as string | null
      if (key && !key.startsWith('http')) {
        resolved._author_avatar_url = await provider.getUrl(key)
      }
      return normalizeNavigationFields({ ...resolved, ...mmIds }, ct.fields)
    }),
  )

  let total = parseInt(countRows[0].count)
  if (locale) {
    // compute total matching locale across all rows (lightweight: only fetch localized column)
    try {
      const { rows: allRows } = await pool.query<Record<string, unknown>>(
        `SELECT localized FROM ${quotedTableName}`,
      )
      const matching = allRows.filter((r) => entryMatchesLocale(r, locale))
      total = matching.length
    } catch {
      // fallback to previous total
    }
  }

  res.json({ data, total, page, limit })
}

async function loadManyToManyIds(
  entryId: string,
  tableName: string,
  fields: import('@plank-cms/schema').FieldDefinition[],
): Promise<Record<string, string[]>> {
  const mmFields = fields.filter(
    (f) => f.type === 'relation' && (f.relationType ?? 'many-to-one') === 'many-to-many',
  )
  if (mmFields.length === 0) return {}
  const result: Record<string, string[]> = {}
  await Promise.all(
    mmFields.map(async (f) => {
      const jt = junctionTableName(tableName, f.name)
      const { rows } = await pool.query<{ target_id: string }>(
        `SELECT target_id FROM ${quoteIdentifier(jt)} WHERE source_id = $1`,
        [entryId],
      )
      result[f.name] = rows.map((r) => r.target_id)
    }),
  )
  return result
}

export const getEntry: SlugIdParam = async (req, res) => {
  const ct = await findContentTypeBySlug(req.params.slug)
  if (!ct) {
    res.status(404).json({ error: 'Content type not found' })
    return
  }

  assertSafeIdentifier(ct.tableName)
  const quotedTableName = quoteIdentifier(ct.tableName)
  const isUser = await isUserRole(req.user?.roleId)
  const { rows } = await pool.query(`SELECT * FROM ${quotedTableName} WHERE id = $1`, [req.params.id])

  if (!rows[0]) {
    res.status(404).json({ error: 'Entry not found' })
    return
  }
  if (isUser && ct.kind === 'collection' && rows[0].created_by !== req.user?.id) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  const locale = req.query.locale ? String(req.query.locale) : undefined
  const fallbacks = req.query.fallback ? String(req.query.fallback).split(',') : []
  const mmIds = await loadManyToManyIds(req.params.id, ct.tableName, ct.fields)
  const provider = await getProvider()
  const resolved = resolveLocalizedRow(rows[0], ct, locale, fallbacks)
  const key = resolved._author_avatar_url as string | null
  if (key && !key.startsWith('http')) resolved._author_avatar_url = await provider.getUrl(key)
  res.json(normalizeNavigationFields({ ...resolved, ...mmIds }, ct.fields))
}

export const createEntry: SlugParam = async (req, res) => {
  const ct = await findContentTypeBySlug(req.params.slug)
  if (!ct) {
    res.status(404).json({ error: 'Content type not found' })
    return
  }

  validate(ct, req.body)

  assertSafeIdentifier(ct.tableName)
  const quotedTableName = quoteIdentifier(ct.tableName)
  const isUser = await isUserRole(req.user?.roleId)
  if (isUser && ct.kind === 'single') {
    res.status(403).json({ error: 'Single types are read-only for User role' })
    return
  }

  // M:M fields are virtual — managed via junction tables, not columns
  const mmFields = ct.fields.filter(
    (f) =>
      f.type === 'relation' &&
      (f.relationType ?? 'many-to-one') === 'many-to-many' &&
      req.body[f.name] !== undefined,
  )
  const fields = ct.fields.filter((f) => req.body[f.name] !== undefined && !isVirtualRelation(f))
  fields.forEach((f) => assertSafeIdentifier(f.name))

  // Single Types: upsert — update the existing entry if one already exists
  if (ct.kind === 'single') {
    const { rows: existing } = await pool.query(`SELECT id FROM ${quotedTableName} LIMIT 1`)
    if (existing[0]) {
      const setClauses = fields
        .map((f, i) =>
          f.type === 'media-gallery' || f.type === 'array'
            || f.type === 'navigation'
            ? `${quoteIdentifier(f.name)} = $${i + 1}::jsonb`
            : `${quoteIdentifier(f.name)} = $${i + 1}`,
        )
        .join(', ')
      const extraClauses: string[] = []
      const extraValues: unknown[] = []
      if (req.body.localized !== undefined) {
        extraClauses.push(`localized = $${fields.length + 1}::jsonb`)
        extraValues.push(JSON.stringify(req.body.localized))
      }
      const allClauses = [setClauses, ...extraClauses].filter(Boolean).join(', ')
      const values = [
        ...fields.map((f) => {
          const v = req.body[f.name]
          const normalized = f.type === 'navigation' ? normalizeNavigationItems(v) : v
          return f.type === 'media-gallery' || f.type === 'array' || f.type === 'navigation'
            ? JSON.stringify(normalized)
            : v
        }),
        ...extraValues,
        existing[0].id,
      ]
      const updateSql =
        fields.length + extraValues.length > 0
          ? `UPDATE ${quotedTableName} SET ${allClauses}, updated_at = NOW() WHERE id = $${fields.length + extraValues.length + 1} RETURNING *`
          : `UPDATE ${quotedTableName} SET updated_at = NOW() WHERE id = $1 RETURNING *`
      const updateValues = fields.length + extraValues.length > 0 ? values : [existing[0].id]
      const { rows } = await pool.query(updateSql, updateValues)
      await Promise.all(
        mmFields.map((f) => {
          const ids = Array.isArray(req.body[f.name]) ? (req.body[f.name] as string[]) : []
          return syncManyToMany(existing[0].id, ct.tableName, f, ids)
        }),
      )
      res.json(normalizeNavigationFields(rows[0], ct.fields))
      return
    }
  }

  const id = createId()
  const userId = req.user?.id ?? null
  const extraCols: string[] = []
  const extraPlaceholders: string[] = []
  const extraValues: unknown[] = []
  if (req.body.localized !== undefined) {
    extraCols.push('localized')
    extraPlaceholders.push(`$${3 + fields.length}::jsonb`)
    extraValues.push(JSON.stringify(req.body.localized))
  }
  const cols = ['id', 'created_by', ...fields.map((f) => f.name), ...extraCols]
    .map((col) => quoteIdentifier(col))
    .join(', ')
  const placeholders = [
    '$1',
    '$2',
    ...fields.map((f, i) =>
      f.type === 'media-gallery' || f.type === 'array' || f.type === 'navigation'
        ? `$${i + 3}::jsonb`
        : `$${i + 3}`,
    ),
    ...extraPlaceholders,
  ].join(', ')
  const values = [
    id,
    userId,
    ...fields.map((f) => {
      const v = req.body[f.name]
      const normalized = f.type === 'navigation' ? normalizeNavigationItems(v) : v
      return f.type === 'media-gallery' || f.type === 'array' || f.type === 'navigation'
        ? JSON.stringify(normalized)
        : v
    }),
    ...extraValues,
  ]

  const { rows } = await pool.query(
    `INSERT INTO ${quotedTableName} (${cols}) VALUES (${placeholders}) RETURNING *`,
    values,
  )
  await Promise.all(
    mmFields.map((f) => {
      const ids = Array.isArray(req.body[f.name]) ? (req.body[f.name] as string[]) : []
      return syncManyToMany(id, ct.tableName, f, ids)
    }),
  )
  res.status(201).json(normalizeNavigationFields(rows[0], ct.fields))
  triggerWebhooks('entry.created', { content_type: req.params.slug, entry_id: rows[0].id })
}

export const getSingleEntry: SlugParam = async (req, res) => {
  const ct = await findContentTypeBySlug(req.params.slug)
  if (!ct) {
    res.status(404).json({ error: 'Content type not found' })
    return
  }
  if (ct.kind !== 'single') {
    res.status(400).json({ error: 'Content type is not a Single Type' })
    return
  }

  assertSafeIdentifier(ct.tableName)
  const quotedTableName = quoteIdentifier(ct.tableName)
  const { rows } = await pool.query(`SELECT * FROM ${quotedTableName} LIMIT 1`)

  if (!rows[0]) {
    res.status(404).json({ error: 'No entry found' })
    return
  }
  const locale = req.query.locale ? String(req.query.locale) : undefined
  const fallbacks = req.query.fallback ? String(req.query.fallback).split(',') : []
  const mmIds = await loadManyToManyIds(rows[0].id, ct.tableName, ct.fields)
  const provider = await getProvider()
  const resolved = resolveLocalizedRow(rows[0], ct, locale, fallbacks)
  const key = resolved._author_avatar_url as string | null
  if (key && !key.startsWith('http')) resolved._author_avatar_url = await provider.getUrl(key)
  res.json(normalizeNavigationFields({ ...resolved, ...mmIds }, ct.fields))
}

export const updateEntry: SlugIdParam = async (req, res) => {
  const ct = await findContentTypeBySlug(req.params.slug)
  if (!ct) {
    res.status(404).json({ error: 'Content type not found' })
    return
  }

  validate(ct, req.body)

  assertSafeIdentifier(ct.tableName)
  const quotedTableName = quoteIdentifier(ct.tableName)
  const isUser = await isUserRole(req.user?.roleId)
  if (isUser && ct.kind === 'single') {
    res.status(403).json({ error: 'Single types are read-only for User role' })
    return
  }
  if (isUser && ct.kind === 'collection') {
    const { rows: authorRows } = await pool.query<{ created_by: string | null }>(
      `SELECT created_by FROM ${quotedTableName} WHERE id = $1`,
      [req.params.id],
    )
    if (!authorRows[0]) {
      res.status(404).json({ error: 'Entry not found' })
      return
    }
    if (authorRows[0].created_by !== req.user?.id) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
  }

  // M:M fields are virtual — managed via junction tables, not columns
  const mmFields = ct.fields.filter(
    (f) =>
      f.type === 'relation' &&
      (f.relationType ?? 'many-to-one') === 'many-to-many' &&
      req.body[f.name] !== undefined,
  )
  const fields = ct.fields.filter((f) => req.body[f.name] !== undefined && !isVirtualRelation(f))
  fields.forEach((f) => assertSafeIdentifier(f.name))

  const setClauses = fields
    .map((f, i) =>
      f.type === 'media-gallery' || f.type === 'array'
        || f.type === 'navigation'
        ? `${quoteIdentifier(f.name)} = $${i + 1}::jsonb`
        : `${quoteIdentifier(f.name)} = $${i + 1}`,
    )
    .join(', ')
  const extraClauses: string[] = []
  const extraValues: unknown[] = []
  if (req.body.localized !== undefined) {
    extraClauses.push(`localized = $${fields.length + 1}::jsonb`)
    extraValues.push(JSON.stringify(req.body.localized))
  }
  const allClauses = [setClauses, ...extraClauses].filter(Boolean).join(', ')
  const values = [
    ...fields.map((f) => {
      const v = req.body[f.name]
      const normalized = f.type === 'navigation' ? normalizeNavigationItems(v) : v
      return f.type === 'media-gallery' || f.type === 'array' || f.type === 'navigation'
        ? JSON.stringify(normalized)
        : v
    }),
    ...extraValues,
    req.params.id,
  ]

  const updateSql =
    fields.length + extraValues.length > 0
      ? `UPDATE ${quotedTableName} SET ${allClauses}, updated_at = NOW() WHERE id = $${fields.length + extraValues.length + 1} RETURNING *`
      : `UPDATE ${quotedTableName} SET updated_at = NOW() WHERE id = $1 RETURNING *`
  const updateValues = fields.length + extraValues.length > 0 ? values : [req.params.id]

  const { rows } = await pool.query(updateSql, updateValues)

  if (!rows[0]) {
    res.status(404).json({ error: 'Entry not found' })
    return
  }

  await Promise.all(
    mmFields.map((f) => {
      const ids = Array.isArray(req.body[f.name]) ? (req.body[f.name] as string[]) : []
      return syncManyToMany(req.params.id, ct.tableName, f, ids)
    }),
  )

  res.json(normalizeNavigationFields(rows[0], ct.fields))
  triggerWebhooks('entry.updated', { content_type: req.params.slug, entry_id: req.params.id })
}

// Columns excluded from the published_data snapshot
const SNAPSHOT_EXCLUDED = [
  "'id'",
  "'status'",
  "'published_data'",
  "'published_at'",
  "'scheduled_for'",
  "'created_at'",
  "'updated_at'",
]

function buildSnapshotExpr(tableName: string): string {
  const strip = SNAPSHOT_EXCLUDED.reduce((expr, col) => `${expr} - ${col}`, `to_jsonb(t.*)`)
  return `(SELECT ${strip} FROM ${quoteIdentifier(tableName)} t WHERE t.id = $1)`
}

export const patchEntryStatus: SlugIdParam = async (req, res) => {
  const { status, scheduled_for } = req.body as { status: unknown; scheduled_for?: unknown }
  if (status !== 'draft' && status !== 'published' && status !== 'scheduled') {
    res.status(400).json({ error: 'status must be draft, published, or scheduled' })
    return
  }

  if (status === 'scheduled') {
    if (!scheduled_for || typeof scheduled_for !== 'string' || isNaN(Date.parse(scheduled_for))) {
      res.status(400).json({ error: 'scheduled_for must be a valid ISO date string' })
      return
    }
    if (new Date(scheduled_for) <= new Date()) {
      res.status(400).json({ error: 'scheduled_for must be in the future' })
      return
    }
  }

  const ct = await findContentTypeBySlug(req.params.slug)
  if (!ct) {
    res.status(404).json({ error: 'Content type not found' })
    return
  }

  assertSafeIdentifier(ct.tableName)
  const quotedTableName = quoteIdentifier(ct.tableName)
  const isUser = await isUserRole(req.user?.roleId)
  if (isUser && ct.kind === 'single') {
    res.status(403).json({ error: 'Single types are read-only for User role' })
    return
  }
  if (isUser && ct.kind === 'collection') {
    const { rows: authorRows } = await pool.query<{ created_by: string | null }>(
      `SELECT created_by FROM ${quotedTableName} WHERE id = $1`,
      [req.params.id],
    )
    if (!authorRows[0]) {
      res.status(404).json({ error: 'Entry not found' })
      return
    }
    if (authorRows[0].created_by !== req.user?.id) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
  }

  let sql: string
  let values: unknown[]

  if (status === 'published') {
    sql = `
      UPDATE ${quotedTableName} SET
        status = 'published',
        published_data = ${buildSnapshotExpr(ct.tableName)},
        published_at = NOW(),
        scheduled_for = NULL,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `
    values = [req.params.id]
  } else if (status === 'scheduled') {
    sql = `
      UPDATE ${quotedTableName} SET
        status = 'scheduled',
        scheduled_for = $2,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `
    values = [req.params.id, scheduled_for]
  } else {
    sql = `
      UPDATE ${quotedTableName} SET
        status = 'draft',
        published_data = NULL,
        published_at = NULL,
        scheduled_for = NULL,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `
    values = [req.params.id]
  }

  const { rows } = await pool.query(sql, values)

  if (!rows[0]) {
    res.status(404).json({ error: 'Entry not found' })
    return
  }
  res.json(normalizeNavigationFields(rows[0], ct.fields))

  const webhookEvent =
    status === 'published' ? 'entry.published' : status === 'draft' ? 'entry.unpublished' : null
  if (webhookEvent)
    triggerWebhooks(webhookEvent, { content_type: req.params.slug, entry_id: req.params.id })
}

export const deleteEntry: SlugIdParam = async (req, res) => {
  const ct = await findContentTypeBySlug(req.params.slug)
  if (!ct) {
    res.status(404).json({ error: 'Content type not found' })
    return
  }

  assertSafeIdentifier(ct.tableName)
  const quotedTableName = quoteIdentifier(ct.tableName)
  const isUser = await isUserRole(req.user?.roleId)
  if (isUser && ct.kind === 'single') {
    res.status(403).json({ error: 'Single types are read-only for User role' })
    return
  }
  if (isUser && ct.kind === 'collection') {
    const { rows: authorRows } = await pool.query<{ created_by: string | null }>(
      `SELECT created_by FROM ${quotedTableName} WHERE id = $1`,
      [req.params.id],
    )
    if (!authorRows[0]) {
      res.status(404).json({ error: 'Entry not found' })
      return
    }
    if (authorRows[0].created_by !== req.user?.id) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
  }
  const { rowCount } = await pool.query(`DELETE FROM ${quotedTableName} WHERE id = $1`, [
    req.params.id,
  ])

  if (!rowCount) {
    res.status(404).json({ error: 'Entry not found' })
    return
  }
  res.status(204).end()
  triggerWebhooks('entry.deleted', { content_type: req.params.slug, entry_id: req.params.id })
}
