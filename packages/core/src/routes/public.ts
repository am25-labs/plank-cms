import { Router, type IRouter } from 'express'
import { apiToken } from '../middlewares/apiToken.js'
import { listPublicEntries, getPublicEntry } from '../controllers/public.js'

const router: IRouter = Router()

router.use(apiToken)

router.get('/:slug', listPublicEntries)
router.get('/:slug/:id', getPublicEntry)

export default router
