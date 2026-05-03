import { getSetting } from './settings.js'

export async function isEditorialModeEnabled(): Promise<boolean> {
  const raw = await getSetting('general', 'editorial_mode')
  return String(raw ?? 'false').toLowerCase() === 'true'
}
