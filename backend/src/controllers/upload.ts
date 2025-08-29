import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import sharp from 'sharp'
import { join } from 'path'
import BadRequestError from '../errors/bad-request-error'
import { UPLOAD_CONFIG } from '../config'

export const uploadFile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.log('Upload file called, user:', res.locals.user?.email)
    console.log(
        'File info:',
        req.file
            ? {
                  originalname: req.file.originalname,
                  filename: req.file.filename,
                  size: req.file.size,
                  mimetype: req.file.mimetype,
              }
            : 'No file'
    )

    if (!req.file) {
        return next(new BadRequestError('Файл не загружен'))
    }
    try {
        // Минимальный размер файла (2KB)
        if (req.file.size < UPLOAD_CONFIG.minFileSize) {
            console.log(
                'File too small:',
                req.file.size,
                '<',
                UPLOAD_CONFIG.minFileSize
            )
            return next(new BadRequestError('Файл слишком маленький'))
        }

        // Максимальный размер файла (10MB)
        if (req.file.size > UPLOAD_CONFIG.maxFileSize) {
            console.log(
                'File too large:',
                req.file.size,
                '>',
                UPLOAD_CONFIG.maxFileSize
            )
            return next(new BadRequestError('Файл слишком большой'))
        }

        // Проверяем, что загруженный файл действительно изображение, читая метаданные
        const absolutePath = join(
            __dirname,
            `../public/${UPLOAD_CONFIG.tempPath}/${req.file.filename}`
        )

        console.log('Checking file at path:', absolutePath)

        try {
            await sharp(absolutePath).metadata()
            console.log('Sharp validation passed')
        } catch (error) {
            // Логируем ошибку для отладки
            console.error('Sharp validation error:', error)
            return next(new BadRequestError('Некорректный файл изображения'))
        }

        const fileName = `/${UPLOAD_CONFIG.path}/${req.file.filename}`
        console.log('Returning fileName:', fileName)
        return res.status(constants.HTTP_STATUS_CREATED).send({
            fileName,
            originalName: req.file.originalname,
        })
    } catch (error) {
        console.error('Upload error:', error)
        return next(error)
    }
}

export default {}
