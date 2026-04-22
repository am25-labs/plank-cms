import type { MediaProvider } from '../index.js'

export const s3Provider: MediaProvider = {
  async upload(_file) {
    throw new Error('S3 provider not yet implemented. Set PLANK_MEDIA_PROVIDER=local or r2.')
  },
  async delete(_key) {
    throw new Error('S3 provider not yet implemented.')
  },
}
