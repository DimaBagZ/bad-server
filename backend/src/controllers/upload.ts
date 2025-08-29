import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import sharp from 'sharp'
import { join } from 'path'
import BadRequestError from '../errors/bad-request-error'

export const uploadFile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.file) {
        return next(new BadRequestError('Файл не загружен'))
    }
    try {
        // Минимальный размер файла (2KB)
        if (req.file.size < 2 * 1024) {
            return next(new BadRequestError('Файл слишком маленький'))
        }

        // Проверяем, что загруженный файл действительно изображение, читая метаданные
        const absolutePath = process.env.UPLOAD_PATH_TEMP
            ? join(__dirname, `../public/${process.env.UPLOAD_PATH_TEMP}/${req.file.filename}`)
            : join(__dirname, `../public/${req.file.filename}`)

        try {
            await sharp(absolutePath).metadata()
        } catch (_e) {
            return next(new BadRequestError('Некорректный файл изображения'))
        }

        const fileName = process.env.UPLOAD_PATH
            ? `/${process.env.UPLOAD_PATH}/${req.file.filename}`
            : `/${req.file?.filename}`
        return res.status(constants.HTTP_STATUS_CREATED).send({
            fileName,
            originalName: req.file?.originalname,
        })
    } catch (error) {
        return next(error)
    }
}

export default {}
