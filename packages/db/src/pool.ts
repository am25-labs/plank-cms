import pg from 'pg'

const pool = new pg.Pool({
  connectionString: process.env.PLANK_DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

pool.on('error', (err: Error) => {
  console.error('[plank/db] Unexpected pool error:', err.message)
  process.exit(1)
})

export default pool
