import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";
import { Prisma } from "../../generated/prisma/client.js";

export const errorHandler = (err: unknown, _req: Request, res: Response, next: NextFunction): void => {
    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            status: 'error',
            message: err.message,
        });
        return;
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2025') {
            res.status(404).json({
                status: 'error',
                message: 'No se encontro el recurso solicitado',
            });
            return;
        }

        if (err.code === 'P2002') {
            res.status(409).json({
                status: 'error',
                message: 'Ya existe un recurso con esos datos',
            });
            return;
        }

        if (err.code === 'P2003') {
            res.status(409).json({
                status: 'error',
                message: 'No se puede completar la operacion porque existe una relacion invalida',
            });
            return;
        }

        if (err.code === 'P2024') {
            console.error(err);
            res.status(503).json({
                status: 'error',
                message: 'El servicio de base de datos no esta disponible temporalmente',
            });
            return;
        }
    }

    if (err instanceof Prisma.PrismaClientInitializationError) {
        console.error(err);
        res.status(503).json({
            status: 'error',
            message: 'El servicio de base de datos no esta disponible temporalmente',
        });
        return;
    }

    if (err instanceof Error && 'type' in err) {
        if (err.type === 'entity.parse.failed') {
            res.status(400).json({
                status: 'error',
                message: 'El cuerpo de la peticion no contiene un JSON valido',
            });
            return;
        }

        if (err.type === 'entity.too.large') {
            res.status(413).json({
                status: 'error',
                message: 'El contenido enviado supera el limite permitido',
            });
            return;
        }
    }

    console.error(err);

    res.status(500).json({
        status: 'error',
        message: 'Ocurrio un fallo general e inesperado dentro del servidor',
    });
}
