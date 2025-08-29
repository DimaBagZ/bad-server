import rateLimit from 'express-rate-limit'

// Общий rate limiter для всех запросов
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100, // максимум 100 запросов с одного IP
    message: {
        error: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
})

// Строгий rate limiter для авторизации
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 5, // максимум 5 попыток входа
    message: {
        error: 'Too many login attempts, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
})

// Rate limiter для загрузки файлов
export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 час
    max: 10, // максимум 10 загрузок
    message: {
        error: 'Too many file uploads, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
})

// Rate limiter для API запросов
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 50, // максимум 50 API запросов (уменьшено для тестов)
    message: {
        error: 'Too many API requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
})
