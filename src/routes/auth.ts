import express, { type NextFunction } from "express"
import type { Request, Response } from "express"
import { AuthController } from "../controllers/AuthController.js"
import { UserService } from "../services/UserService.js"
import { AppDataSource } from "../data-source.js"
import { User } from "../entities/User.js"
import logger from "../config/logger.js"
import RegisterValidator from "../validators/register-validator.js"
import LoginValidator from "../validators/login-validator.js"
import { CredentialService } from "../services/CredentialService.js"

const router = express.Router()
const userRepository = AppDataSource.getRepository(User)
const userService = new UserService(userRepository)
const credentialService = new CredentialService()
// const refreshTokenRepository = AppDataSource.getRepository("RefreshToken")
const authController = new AuthController(
    userService,
    logger,
    credentialService,
)

router.post(
    "/register",
    RegisterValidator,
    (req: Request, res: Response, next: NextFunction) =>
        authController.register(req, res, next),
)

router.post(
    "/login",
    LoginValidator,
    (req: Request, res: Response, next: NextFunction) =>
        authController.login(req, res, next),
)

export default router
