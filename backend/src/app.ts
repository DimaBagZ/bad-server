import { errors } from 'celebrate'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import 'dotenv/config'
import express, { json, urlencoded } from 'express'
import mongoose from 'mongoose'
import path from 'path'
import { DB_ADDRESS } from './config'
import errorHandler from './middlewares/error-handler'
import serveStatic from './middlewares/serverStatic'
import routes from './routes'
import { generalLimiter, apiLimiter } from './middlewares/rateLimit'
import {
    securityHeaders,
    sanitizeInput,
    pathTraversalProtection,
    requestSizeLimit,
} from './middlewares/security'

const { PORT = 3000 } = process.env
const app = express()

// Trust proxy для rate limiting
app.set('trust proxy', 1)

// Безопасность базовых заголовков и проверок пути/размера запроса
app.use(securityHeaders)
app.use(pathTraversalProtection)
app.use(requestSizeLimit)

// Rate limiting
app.use(generalLimiter)
app.use('/api', apiLimiter)

app.use(cookieParser())

// Явно настраиваем CORS с параметрами, чтобы политика была не пустой
// (ожидается тестами и необходима для корректной работы cookie/кредитеншиалов)
const corsOptions = {
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}
app.use(cors(corsOptions))

app.use(serveStatic(path.join(__dirname, 'public')))

// Подключаем парсеры тела ЗАПРОСА ДО санитизации,
// чтобы sanitizeInput мог обработать уже распарсенный req.body
app.use(urlencoded({ extended: true, limit: '10mb' }))
app.use(json({ limit: '10mb' }))

// Санитизация ввода (body/query/params) после парсеров
app.use(sanitizeInput)

app.options('*', cors(corsOptions))

app.use('/api', routes)
app.use(errors())
app.use(errorHandler)

// eslint-disable-next-line no-console

const bootstrap = async () => {
    try {
        console.log('Connecting to database:', DB_ADDRESS)
        await mongoose.connect(DB_ADDRESS)
        console.log('Connected to database successfully')
        await app.listen(PORT, () => console.log('ok'))
    } catch (error) {
        console.error(error)
    }
}

bootstrap()
