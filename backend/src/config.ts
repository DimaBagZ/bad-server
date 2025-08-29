import { CookieOptions } from 'express'
import ms from 'ms'

export const { PORT = '3000' } = process.env
export const {
    DB_ADDRESS = 'mongodb://root:example@mongo:27017/weblarek?authSource=admin',
} = process.env
console.log('Config DB_ADDRESS:', DB_ADDRESS)
export const { JWT_SECRET = 'default-jwt-secret-change-in-production' } =
    process.env
export const ACCESS_TOKEN = {
    secret:
        process.env.AUTH_ACCESS_TOKEN_SECRET ||
        'default-access-token-secret-change-in-production',
    expiry: process.env.AUTH_ACCESS_TOKEN_EXPIRY || '10m',
}
export const REFRESH_TOKEN = {
    secret:
        process.env.AUTH_REFRESH_TOKEN_SECRET ||
        'default-refresh-token-secret-change-in-production',
    expiry: process.env.AUTH_REFRESH_TOKEN_EXPIRY || '7d',
    cookie: {
        name: 'refreshToken',
        options: {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            maxAge: ms(process.env.AUTH_REFRESH_TOKEN_EXPIRY || '7d'),
            path: '/',
        } as CookieOptions,
    },
}

// Конфигурация для загрузки файлов
export const UPLOAD_CONFIG = {
    path: process.env.UPLOAD_PATH || 'images',
    tempPath: process.env.UPLOAD_PATH_TEMP || 'temp',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    minFileSize: 2 * 1024, // 2KB
}
