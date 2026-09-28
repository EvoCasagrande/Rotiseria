import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'

export const validate = (schema: z.ZodType) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse({
            body: req.body,
            params: req.params,
            query: req.query,
        });

        if (!result.success) {
            res.status(400).json({
                status: 'error',
                message: 'Datos invalidos',
                errors: result.error.issues,
            })
            return
        }

        res.locals.validated = result.data

        next()
    }
}
