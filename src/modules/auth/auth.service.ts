import bcrypt from "bcryptjs"
import { prisma } from "../../lib/prisma.js"
import { AppError } from "../../utils/AppError.js"
import type { ChangePasswordInput, LoginInput } from "./auth.schema.js"
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

        if (!admin || !admin.active || (payload.tokenVersion ?? 0) !== admin.tokenVersion) {
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

        const token = jwt.sign({ id: admin.id, tokenVersion: admin.tokenVersion }, jwtSecret, {
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

    changePassword = async (id: string, data: ChangePasswordInput): Promise<void> => {
        const admin = await prisma.adminUser.findUnique({ where: { id } })
        if (!admin || !admin.active || !(await bcrypt.compare(data.currentPassword, admin.passwordHash))) {
            throw new AppError('La contrasena actual no es correcta', 401)
        }
        const passwordHash = await bcrypt.hash(data.newPassword, 10)
        const result = await prisma.adminUser.updateMany({ where: { id, passwordHash: admin.passwordHash }, data: { passwordHash, tokenVersion: { increment: 1 } } })
        if (!result.count) throw new AppError('La contrasena cambio en otra sesion. Inicia sesion nuevamente.', 409)
    }
}
