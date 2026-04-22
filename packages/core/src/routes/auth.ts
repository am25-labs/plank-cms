import { Router, type IRouter } from 'express'
import { login, register } from '../controllers/auth.js'

const router: IRouter = Router()

router.post('/login', login)
router.post('/register', register)

export default router
