import { Router } from 'express'
import {
    createProduct,
    deleteProduct,
    getProducts,
    updateProduct,
} from '../controllers/products'
import auth, { roleGuardMiddleware } from '../middlewares/auth'
import {
    validateObjId,
    validateProductBody,
    validateProductUpdateBody,
} from '../middlewares/validations'
import { Role } from '../models/user'
import { validateCSRFToken } from '../middlewares/csrf'

const productRouter = Router()

productRouter.get('/', getProducts)
productRouter.post(
    '/',
    auth,
    roleGuardMiddleware(Role.Admin),
    validateCSRFToken,
    validateProductBody,
    createProduct
)
productRouter.delete(
    '/:productId',
    auth,
    roleGuardMiddleware(Role.Admin),
    validateCSRFToken,
    validateObjId,
    deleteProduct
)
productRouter.patch(
    '/:productId',
    auth,
    roleGuardMiddleware(Role.Admin),
    validateCSRFToken,
    validateObjId,
    validateProductUpdateBody,
    updateProduct
)

export default productRouter
