import { Router, type IRouter } from 'express'
import { login, loginWithTwoFactor, logout, register, setup } from '../controllers/auth.js'

const router: IRouter = Router()

router.get('/setup', setup)
router.post('/login', login)
router.post('/login/2fa', loginWithTwoFactor)
router.post('/logout', logout)
router.post('/register', register)

export default router
