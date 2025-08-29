import { NextFunction, Request, Response } from 'express'
import path from 'path'

/**
 * Middleware для защиты от Path Traversal атак
 */
export const pathTraversalProtection = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const requestedPath = req.path

    // Пропускаем проверку для API загрузки файлов
    if (
        requestedPath === '/api/upload' ||
        requestedPath.startsWith('/api/upload')
    ) {
        return next()
    }

    // Проверяем на наличие попыток обхода директорий
    if (requestedPath.includes('..') || requestedPath.includes('~')) {
        return res.status(400).json({ error: 'Invalid path' })
    }

    // Нормализуем путь
    const normalizedPath = path.normalize(requestedPath)

    // Проверяем, что путь не выходит за пределы разрешенной директории
    if (normalizedPath.startsWith('..')) {
        return res.status(400).json({ error: 'Invalid path' })
    }

    next()
}

/**
 * Middleware для ограничения размера запросов
 */
export const requestSizeLimit = (
    _req: Request,
    res: Response,
    next: NextFunction
) => {
    // Пропускаем проверку для multipart/form-data (загрузка файлов)
    // так как multer уже обрабатывает размер файлов
    if (_req.headers['content-type']?.includes('multipart/form-data')) {
        return next()
    }

    const contentLength = parseInt(_req.headers['content-length'] || '0', 10)
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (contentLength > maxSize) {
        return res.status(413).json({ error: 'Request entity too large' })
    }

    next()
}

/**
 * Middleware для защиты заголовков
 */
export const securityHeaders = (
    _req: Request,
    res: Response,
    next: NextFunction
) => {
    // Защита от XSS
    res.setHeader('X-XSS-Protection', '1; mode=block')

    // Защита от MIME sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff')

    // Защита от clickjacking
    res.setHeader('X-Frame-Options', 'DENY')

    // Strict Transport Security
    if (process.env.NODE_ENV === 'production') {
        res.setHeader(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains'
        )
    }

    // Content Security Policy: по умолчанию всё с собственного источника,
    // дополнительно разрешаем безопасную загрузку изображений/шрифтов и data: для inlined assets
    res.setHeader(
        'Content-Security-Policy',
        [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self' data:",
            "connect-src 'self'",
        ].join('; ')
    )

    next()
}

/**
 * Middleware для санитизации входных данных
 */
export const sanitizeInput = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    // Пропускаем санитизацию для multipart/form-data (загрузка файлов)
    if (req.headers['content-type']?.includes('multipart/form-data')) {
        return next()
    }

    // Функция для рекурсивной очистки объекта
    const sanitize = (obj: unknown): unknown => {
        if (typeof obj === 'string') {
            // Удаляем потенциально опасные символы
            return obj
                .replace(/[<>]/g, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+=/gi, '')
                .trim()
        }

        if (Array.isArray(obj)) {
            return obj.map(sanitize)
        }

        if (obj && typeof obj === 'object') {
            const sanitized: Record<string, unknown> = {}
            for (const [key, value] of Object.entries(obj)) {
                sanitized[key] = sanitize(value)
            }
            return sanitized
        }

        return obj
    }

    // Очищаем body, query и params
    if (req.body) {
        req.body = sanitize(req.body) as typeof req.body
    }

    if (req.query) {
        req.query = sanitize(req.query) as typeof req.query
    }

    if (req.params) {
        req.params = sanitize(req.params) as typeof req.params
    }

    next()
}
