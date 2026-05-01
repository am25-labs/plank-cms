import { Router, type IRouter } from 'express'
import { login, loginWithTwoFactor, register, setup } from '../controllers/auth.js'

const router: IRouter = Router()

router.get('/setup', setup)
router.post('/login', login)
router.post('/login/2fa', loginWithTwoFactor)
router.post('/register', register)

export default router
