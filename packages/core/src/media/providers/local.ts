import { writeFile, mkdir } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { randomBytes } from 'node:crypto'
import type { MediaProvider } from '../index.js'

const uploadsDir = () =>
  join(process.cwd(), process.env.PLANK_UPLOADS_DIR ?? 'public/uploads')

export const localProvider: MediaProvider = {
  async upload(file) {
    const dir = uploadsDir()
    await mkdir(dir, { recursive: true })

    const ext = extname(file.originalname)
    const key = `${randomBytes(16).toString('hex')}${ext}`
    await writeFile(join(dir, key), file.buffer)

    const baseUrl = process.env.PLANK_PUBLIC_URL ?? 'http://localhost:1337'
    return { url: `${baseUrl}/uploads/${key}`, key }
  },

  async delete(key) {
    const { unlink } = await import('node:fs/promises')
    await unlink(join(uploadsDir(), key))
  },
}
