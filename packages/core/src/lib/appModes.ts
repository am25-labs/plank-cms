import { isEditorialModeEnabled } from './editorialMode.js'

export interface AppModes {
  editorial: boolean
}

export async function resolveAppModes(): Promise<AppModes> {
  return {
    editorial: await isEditorialModeEnabled(),
  }
}

