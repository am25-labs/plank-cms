import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 12
const TAG_LENGTH = 16

function getKey(): Buffer | null {
  const raw = process.env.PLANK_ENCRYPTION_KEY
  if (!raw) return null
  const buf = Buffer.from(raw, 'hex')
  if (buf.length !== KEY_LENGTH) {
    console.warn('[plank] PLANK_ENCRYPTION_KEY must be 64 hex chars (32 bytes). Falling back to plaintext storage.')
    return null
  }
  return buf
}

export function encrypt(plaintext: string): string {
  const key = getKey()
  if (!key) return plaintext

  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  // format: iv(12) + tag(16) + ciphertext — all hex-encoded
  return Buffer.concat([iv, tag, encrypted]).toString('hex')
}

export function decrypt(stored: string): string {
  const key = getKey()
  if (!key) return stored

  try {
    const buf = Buffer.from(stored, 'hex')
    const iv = buf.subarray(0, IV_LENGTH)
    const tag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH)
    const ciphertext = buf.subarray(IV_LENGTH + TAG_LENGTH)

    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)
    return decipher.update(ciphertext) + decipher.final('utf8')
  } catch {
    // not encrypted (stored before encryption was configured), return as-is
    return stored
  }
}
