import { writeFile, mkdir } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { randomBytes } from 'node:crypto'
import { getSetting } from '../../lib/settings.js'
import type { MediaProvider } from '../index.js'

async function uploadsDir(): Promise<string> {
  const fromSettings = await getSetting('media', 'local.uploads_dir')
  return fromSettings ?? process.env.PLANK_UPLOADS_DIR ?? 'public/uploads'
}

async function publicUrl(): Promise<string> {
  const fromSettings = await getSetting('media', 'local.public_url')
  return fromSettings ?? process.env.PLANK_PUBLIC_URL ?? 'http://localhost:1337'
}

export const localProvider: MediaProvider = {
  async upload(file) {
    const dir = await uploadsDir()
    await mkdir(dir, { recursive: true })

    const ext = extname(file.originalname)
    const key = `${randomBytes(16).toString('hex')}${ext}`
    await writeFile(join(dir, key), file.buffer)

    const base = await publicUrl()
    return { url: `${base}/uploads/${key}`, key }
  },

  async delete(key) {
    const { unlink } = await import('node:fs/promises')
    const dir = await uploadsDir()
    await unlink(join(dir, key))
  },

  async getUrl(key) {
    const base = await publicUrl()
    return `${base}/uploads/${key}`
  },
}
