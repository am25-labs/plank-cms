import type { MediaProvider } from '../index.js'

export const r2Provider: MediaProvider = {
  async upload(_file) {
    throw new Error('R2 provider not yet implemented. Set PLANK_MEDIA_PROVIDER=local or s3.')
  },
  async delete(_key) {
    throw new Error('R2 provider not yet implemented.')
  },
}
