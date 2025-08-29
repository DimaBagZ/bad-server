import { Router } from 'express'
import {
    getCurrentUser,
    getCurrentUserRoles,
    login,
    logout,
    refreshAccessToken,
    register,
    updateCurrentUser,
    changePassword,
} from '../controllers/auth'
import auth from '../middlewares/auth'
import { generateCSRFToken } from '../middlewares/csrf'
import { authLimiter } from '../middlewares/rateLimit'
import { validateChangePasswordBody } from '../middlewares/validations'

const authRouter = Router()

authRouter.get('/user', auth, getCurrentUser)
authRouter.patch('/me', auth, updateCurrentUser)
authRouter.patch('/password', auth, validateChangePasswordBody, changePassword)
authRouter.get('/user/roles', auth, getCurrentUserRoles)
authRouter.get('/csrf-token', generateCSRFToken, (_req, res) => {
    res.json({ message: 'CSRF token generated' })
})
authRouter.post('/login', authLimiter, login)
authRouter.get('/token', refreshAccessToken)
authRouter.get('/logout', logout)
authRouter.post('/register', authLimiter, register)

export default authRouter
