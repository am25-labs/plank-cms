import { migrate } from '@plank/db'
import app from './app.js'

const PORT = process.env.PLANK_PORT ?? 5500

async function start(): Promise<void> {
  await migrate()
  app.listen(PORT, () => {
    console.log(`[plank] Server running → http://localhost:${PORT}`)
    console.log(`[plank] Admin panel  → http://localhost:${PORT}/admin`)
    console.log(`[plank] REST API     → http://localhost:${PORT}/api`)
  })
}

start().catch((err) => {
  console.error('[plank] Failed to start:', err)
  process.exit(1)
})
