import type { Request, Response } from "express"
import type { LoginInput } from "./auth.schema.js"
import { AuthService } from "./auth.service.js"
import type { AuthAdmin } from "../../middlewares/requireAuth.js"

type ValidatedLocals<T> = {
    validated: T
}

export class AuthController {
    constructor(private readonly authService: AuthService){}

    me = async(_req: Request, res: Response): Promise<void> => {
        const admin = (res.locals as { admin: AuthAdmin }).admin

        res.status(200).json({
            status: 'success',
            admin
        })
    }

    login = async(_req: Request, res: Response<unknown, ValidatedLocals<{ body: LoginInput }>>,): Promise<void> => {
        const result = await this.authService.login(res.locals.validated.body);

        res.status(200).json({
            status: 'success',
            ...result
        })
    }
}
