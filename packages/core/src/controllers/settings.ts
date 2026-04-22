import type { Request, Response } from 'express'
import { getSettings, setSettings } from '../lib/settings.js'

// Sensitive fields are masked in GET responses — never returned to the client
const SENSITIVE_FIELDS: Record<string, Set<string>> = {
  media: new Set(['s3.secret_access_key', 'r2.secret_access_key']),
}

const MASKED = '••••••••'

function maskSettings(namespace: string, settings: Record<string, string>): Record<string, string> {
  const sensitive = SENSITIVE_FIELDS[namespace]
  if (!sensitive) return settings

  return Object.fromEntries(
    Object.entries(settings).map(([k, v]) => [k, sensitive.has(k) && v ? MASKED : v]),
  )
}

export async function getNamespaceSettings(req: Request<{ namespace: string }>, res: Response): Promise<void> {
  const { namespace } = req.params
  const settings = await getSettings(namespace)
  res.json(maskSettings(namespace, settings))
}

export async function updateNamespaceSettings(req: Request<{ namespace: string }>, res: Response): Promise<void> {
  const { namespace } = req.params
  const incoming = req.body as Record<string, string>

  if (typeof incoming !== 'object' || Array.isArray(incoming)) {
    res.status(400).json({ error: 'Body must be a flat key-value object' })
    return
  }

  const sensitive = SENSITIVE_FIELDS[namespace]
  const toSave: Record<string, string> = {}

  for (const [key, value] of Object.entries(incoming)) {
    // Skip sensitive fields that are empty or still masked — don't overwrite existing value
    if (sensitive?.has(key) && (!value || value === MASKED)) continue
    toSave[key] = value
  }

  await setSettings(namespace, toSave)

  const updated = await getSettings(namespace)
  res.json(maskSettings(namespace, updated))
}
