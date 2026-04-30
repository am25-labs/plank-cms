import type { Request, Response, NextFunction } from 'express'
import { ValidationError, SchemaError } from '@plank-cms/schema'
import { ZodError, flattenError } from 'zod'

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ValidationError) {
    res.status(400).json({ errors: err.errors })
    return
  }

  if (err instanceof SchemaError) {
    res.status(400).json({ error: err.message })
    return
  }

  if (err instanceof ZodError) {
    res.status(400).json({ errors: flattenError(err, (i) => i.message) })
    return
  }

  console.error('[plank] Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
}
