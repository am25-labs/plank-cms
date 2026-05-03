import type { Request, Response, NextFunction } from 'express'
import { resolveAppModes } from '../lib/appModes.js'

export async function attachAppModes(req: Request, _res: Response, next: NextFunction): Promise<void> {
  req.appModes = await resolveAppModes()
  next()
}

