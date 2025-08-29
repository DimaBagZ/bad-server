import { NextFunction, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'

export default function serveStatic(baseDir: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        // Определяем полный путь к запрашиваемому файлу
        const filePath = path.join(baseDir, req.path)

        // Проверяем, что путь существует и это ИМЕННО файл (а не каталог)
        fs.stat(filePath, (err, stats) => {
            if (err) {
                return next()
            }
            if (!stats.isFile()) {
                return next()
            }
            return res.sendFile(filePath, (error) => {
                if (error) {
                    next(error)
                }
            })
        })
    }
}
