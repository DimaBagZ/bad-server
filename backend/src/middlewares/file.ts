import { Request, Express } from 'express'
import multer, { FileFilterCallback } from 'multer'
import { join, extname } from 'path'
import uniqueSlug from 'unique-slug'

type DestinationCallback = (error: Error | null, destination: string) => void
type FileNameCallback = (error: Error | null, filename: string) => void

const storage = multer.diskStorage({
    destination: (
        _req: Request,
        _file: Express.Multer.File,
        cb: DestinationCallback
    ) => {
        cb(
            null,
            join(
                __dirname,
                process.env.UPLOAD_PATH_TEMP
                    ? `../public/${process.env.UPLOAD_PATH_TEMP}`
                    : '../public'
            )
        )
    },

    filename: (
        _req: Request,
        file: Express.Multer.File,
        cb: FileNameCallback
    ) => {
        // Генерируем безопасное имя файла, исключая использование originalname в пути
        const extension = extname(file.originalname).toLowerCase()
        const safeBase = uniqueSlug()
        cb(null, `${safeBase}${extension}`)
    },
})

const types = [
    'image/png',
    'image/jpg',
    'image/jpeg',
    'image/gif',
    'image/svg+xml',
]

const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
) => {
    // Проверяем MIME тип
    if (!types.includes(file.mimetype)) {
        return cb(null, false)
    }

    // Проверяем расширение файла
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg']
    const fileExtension = extname(file.originalname).toLowerCase()

    if (!allowedExtensions.includes(fileExtension)) {
        return cb(null, false)
    }

    return cb(null, true)
}

export default multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 1, // максимум 1 файл
    },
})
