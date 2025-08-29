import { NextFunction, Request, Response } from 'express'
import Tokens from 'csrf'

const tokens = new Tokens()

/**
 * Middleware для генерации CSRF токена
 */
export const generateCSRFToken = (
    _req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const secret = tokens.secretSync()
        const token = tokens.create(secret)

        // Сохраняем секрет в сессии или куки
        res.cookie('csrf-secret', secret, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000, // 24 часа
        })

        // Добавляем токен в заголовки для фронтенда
        res.setHeader('X-CSRF-Token', token)
        // Разрешаем браузеру читать пользовательский заголовок в fetch (CORS)
        res.setHeader('Access-Control-Expose-Headers', 'X-CSRF-Token')

        next()
    } catch (error) {
        next(error)
    }
}

/**
 * Middleware для валидации CSRF токена
 */
export const validateCSRFToken = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const secret = req.cookies['csrf-secret']
        const token = (req.headers['x-csrf-token'] as string) || req.body.csrf

        if (!secret || !token) {
            return res.status(403).json({ error: 'CSRF token missing' })
        }

        if (!tokens.verify(secret, token)) {
            return res.status(403).json({ error: 'Invalid CSRF token' })
        }

        next()
    } catch (error) {
        next(error)
    }
}
