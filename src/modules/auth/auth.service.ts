import { prisma } from "../../lib/prisma.js"
import type { LoginInput, RegisterInput } from "./auth.schema.js"

export class AuthService {
    register = async(data: RegisterInput) => {
        const admin = await prisma.
    }

    login = async(data: LoginInput) => {
        
    }
}