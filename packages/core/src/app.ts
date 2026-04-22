import express, { type Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import authRouter from './routes/auth.js'
import adminRouter from './routes/admin.js'
import publicRouter from './routes/public.js'
import { errorHandler } from './middlewares/errorHandler.js'

const app: Express = express()

app.use(helmet())
app.use(cors())
app.use(express.json())

app.use('/cms/auth', authRouter)
app.use('/cms/admin', adminRouter)
app.use('/api', publicRouter)

// Serve admin panel static files in production
if (process.env.NODE_ENV === 'production') {
  const adminDist = join(dirname(fileURLToPath(import.meta.url)), '../../admin/dist')
  app.use('/admin', express.static(adminDist))
}

app.use(errorHandler)

export default app
