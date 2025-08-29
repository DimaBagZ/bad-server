import { Router } from 'express'
import {
    createOrder,
    deleteOrder,
    getOrderByNumber,
    getOrderCurrentUserByNumber,
    getOrders,
    getOrdersCurrentUser,
    updateOrder,
} from '../controllers/order'
import auth, { roleGuardMiddleware } from '../middlewares/auth'
import { validateOrderBody } from '../middlewares/validations'
import { Role } from '../models/user'
import { validateCSRFToken } from '../middlewares/csrf'

const orderRouter = Router()

orderRouter.post('/', auth, validateCSRFToken, validateOrderBody, createOrder)
// Доступ к базе всех заказов ограничен ролью admin
orderRouter.get('/all', auth, roleGuardMiddleware(Role.Admin), getOrders)
orderRouter.get('/all/me', auth, getOrdersCurrentUser)
orderRouter.get(
    '/:orderNumber',
    auth,
    roleGuardMiddleware(Role.Admin),
    getOrderByNumber
)
orderRouter.get('/me/:orderNumber', auth, getOrderCurrentUserByNumber)
orderRouter.patch(
    '/:orderNumber',
    auth,
    roleGuardMiddleware(Role.Admin),
    validateCSRFToken,
    updateOrder
)

orderRouter.delete(
    '/:id',
    auth,
    roleGuardMiddleware(Role.Admin),
    validateCSRFToken,
    deleteOrder
)

export default orderRouter
