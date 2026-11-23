import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken';
import { jwtSecret } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { prisma } from '../lib/prisma.js';

type AuthPayload = {
    id: string
    tokenVersion?: number
}

export type AuthAdmin = {
    id: string
    name: string
    email: string
    active: boolean
}

export const requireAuth = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    const auth = req.get('Authorization');

    if (!auth || !auth.startsWith('Bearer ')) {
        throw new AppError('Token requerido', 401)
    }

    const token = auth.slice(7);

    let payload: AuthPayload

    try {
        payload = jwt.verify(token, jwtSecret) as AuthPayload
    }catch {
        throw new AppError('Token invalido', 401)
    }

    if (!payload.id) {
        throw new AppError('Token invalido', 401)
    }

    const admin = await prisma.adminUser.findUnique({
        where: {
            id: payload.id
        }
    })

    if(!admin || !admin.active || (payload.tokenVersion ?? 0) !== admin.tokenVersion){
        throw new AppError('Usuario no autorizado', 401);
    }

    ;(res.locals as { admin: AuthAdmin }).admin = {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        active: admin.active,
    }

    next()
}
