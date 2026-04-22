import { Router, type IRouter } from 'express'
import { login, register, setup } from '../controllers/auth.js'

const router: IRouter = Router()

router.get('/setup', setup)
router.post('/login', login)
router.post('/register', register)

export default router
