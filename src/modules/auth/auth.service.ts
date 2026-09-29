import bcrypt from "bcryptjs"
import { prisma } from "../../lib/prisma.js"
import { AppError } from "../../utils/AppError.js"
import type { LoginInput } from "./auth.schema.js"
import jwt from "jsonwebtoken"
import { jwtSecret } from "../../config/env.js"

export class AuthService {
    me = async(token: string) => {
        const payload = jwt.verify(token, jwtSecret)

        if (typeof payload === 'string' || !payload.id) {
            throw new AppError('Token invalido', 401)
        }

        const admin = await prisma.adminUser.findUnique({
            where: {
                id: payload.id
            }
        })

        if (!admin || !admin.active) {
            throw new AppError('Usuario no autorizado', 401)
        }

        return {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            active: admin.active,
        }
    }

    login = async(data: LoginInput) => {
        const admin = await prisma.adminUser.findUnique({
            where: {
                email: data.email
            }
        });

        if (!admin || !admin.active) {
            throw new AppError('Usuario o contrasena incorrectos', 401)
        }

        const passwordIsCorrect = await bcrypt.compare(data.password, admin.passwordHash);

        if(!passwordIsCorrect) {
            throw new AppError('Usuario o contrasena incorrectos', 401)
        }

        const token = jwt.sign({ id: admin.id }, jwtSecret, {
            expiresIn: '12h'
        })

        const safeAdmin = {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            active: admin.active,
        }

        const adminWithToken = {
            token,
            admin: safeAdmin
        }

        return adminWithToken
    }
}