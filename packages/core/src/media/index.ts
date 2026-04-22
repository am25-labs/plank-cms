import multer from 'multer'
import { localProvider } from './providers/local.js'
import { s3Provider } from './providers/s3.js'
import { r2Provider } from './providers/r2.js'

export interface MediaProvider {
  upload(file: Express.Multer.File): Promise<{ url: string; key: string }>
  delete(key: string): Promise<void>
}

const providers: Record<string, MediaProvider> = {
  local: localProvider,
  s3: s3Provider,
  r2: r2Provider,
}

export function getProvider(): MediaProvider {
  const name = process.env.PLANK_MEDIA_PROVIDER ?? 'local'
  const provider = providers[name]
  if (!provider) throw new Error(`Unknown media provider: "${name}". Use local, s3, or r2.`)
  return provider
}

export const upload = multer({ storage: multer.memoryStorage() })
