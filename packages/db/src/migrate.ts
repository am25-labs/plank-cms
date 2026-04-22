import { readdir, readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { PoolClient } from 'pg'
import pool from './pool.js'
import { createId } from './id.js'

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'migrations')

async function ensureMigrationsTable(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS plank_migrations (
      id         TEXT PRIMARY KEY,
      filename   VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `)
}

async function appliedMigrations(client: PoolClient): Promise<Set<string>> {
  const { rows } = await client.query<{ filename: string }>(
    'SELECT filename FROM plank_migrations ORDER BY filename',
  )
  return new Set(rows.map((r) => r.filename))
}

async function seedDefaultRole(client: PoolClient): Promise<void> {
  const { rows } = await client.query<{ count: string }>(
    'SELECT COUNT(*) as count FROM plank_roles',
  )
  if (parseInt(rows[0].count) > 0) return

  await client.query(
    'INSERT INTO plank_roles (id, name, permissions) VALUES ($1, $2, $3)',
    [createId(), 'admin', JSON.stringify(['*'])],
  )
  console.log('[plank/db] Seeded default admin role.')
}

export async function migrate(): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await ensureMigrationsTable(client)

    const files = (await readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith('.sql'))
      .sort()

    const applied = await appliedMigrations(client)

    for (const file of files) {
      if (applied.has(file)) continue
      const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8')
      await client.query(sql)
      await client.query(
        'INSERT INTO plank_migrations (id, filename) VALUES ($1, $2)',
        [createId(), file],
      )
      console.log(`[plank/db] Applied migration: ${file}`)
    }

    await seedDefaultRole(client)
    await client.query('COMMIT')
    console.log('[plank/db] Migrations up to date.')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
