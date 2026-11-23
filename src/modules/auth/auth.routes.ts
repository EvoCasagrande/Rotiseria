import { Router } from "express"
import { validate } from "../../middlewares/validate.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { changePasswordSchema, loginSchema } from "./auth.schema.js";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { rateLimit } from "../../middlewares/rateLimit.js";

const authService = new AuthService();
const authController = new AuthController(authService);

const router = Router();

router
    .post('/login', rateLimit(15, 15 * 60 * 1000), validate(loginSchema), authController.login)

router
    .get('/me', requireAuth, authController.me)

router.post('/change-password', requireAuth, rateLimit(10, 15 * 60 * 1000), validate(changePasswordSchema), authController.changePassword)

export default router
