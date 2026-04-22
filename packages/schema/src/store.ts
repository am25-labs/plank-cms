import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pool } from '@plank/db'
import type { ContentType } from './types.js'

function schemasDir(): string {
  return process.env.PLANK_SCHEMAS_DIR ?? join(process.cwd(), 'plank-schemas')
}

function schemaPath(slug: string): string {
  return join(schemasDir(), `${slug}.json`)
}

async function ensureSchemasDir(): Promise<void> {
  await mkdir(schemasDir(), { recursive: true })
}

// ── Disk ────────────────────────────────────────────────────────────────────

async function writeToDisk(contentType: ContentType): Promise<void> {
  await ensureSchemasDir()
  await writeFile(schemaPath(contentType.slug), JSON.stringify(contentType, null, 2), 'utf8')
}

async function readFromDisk(slug: string): Promise<ContentType> {
  const raw = await readFile(schemaPath(slug), 'utf8')
  return JSON.parse(raw) as ContentType
}

// ── Database ─────────────────────────────────────────────────────────────────

type ContentTypeRow = {
  id: number
  name: string
  slug: string
  table_name: string
  fields: ContentType['fields']
  created_at: Date
  updated_at: Date
}

function rowToContentType(row: ContentTypeRow): ContentType {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    tableName: row.table_name,
    fields: row.fields,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ── Public CRUD ──────────────────────────────────────────────────────────────

export async function findAllContentTypes(): Promise<ContentType[]> {
  const { rows } = await pool.query<ContentTypeRow>(
    'SELECT * FROM plank_content_types ORDER BY name',
  )
  return rows.map(rowToContentType)
}

export async function findContentTypeBySlug(slug: string): Promise<ContentType | null> {
  const { rows } = await pool.query<ContentTypeRow>(
    'SELECT * FROM plank_content_types WHERE slug = $1',
    [slug],
  )
  return rows[0] ? rowToContentType(rows[0]) : null
}

export async function saveContentType(contentType: ContentType): Promise<ContentType> {
  const { rows } = await pool.query<ContentTypeRow>(
    `INSERT INTO plank_content_types (name, slug, table_name, fields)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [contentType.name, contentType.slug, contentType.tableName, JSON.stringify(contentType.fields)],
  )
  const saved = rowToContentType(rows[0])
  await writeToDisk(saved)
  return saved
}

export async function updateContentType(
  slug: string,
  contentType: ContentType,
): Promise<ContentType> {
  const { rows } = await pool.query<ContentTypeRow>(
    `UPDATE plank_content_types
     SET name = $1, fields = $2, updated_at = NOW()
     WHERE slug = $3
     RETURNING *`,
    [contentType.name, JSON.stringify(contentType.fields), slug],
  )
  const updated = rowToContentType(rows[0])
  await writeToDisk(updated)
  return updated
}

export async function deleteContentType(slug: string): Promise<void> {
  await pool.query('DELETE FROM plank_content_types WHERE slug = $1', [slug])
  // Disk file kept intentionally as a backup — core handles removal if needed.
}

export { readFromDisk as readContentTypeFromDisk }
