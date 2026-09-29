import { Router } from "express"
import { validate } from "../../middlewares/validate.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { loginSchema } from "./auth.schema.js";
import { requireAuth } from "../../middlewares/requireAuth.js";

const authService = new AuthService();
const authController = new AuthController(authService);

const router = Router();

router
    .post('/login', validate(loginSchema), authController.login)

router
    .get('/me', requireAuth, authController.me)

export default router