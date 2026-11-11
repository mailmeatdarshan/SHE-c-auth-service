import express, { type NextFunction } from "express"
import type { Request, Response } from "express"
import { AuthController } from "../controllers/AuthController.js"
import { UserService } from "../services/UserService.js"
import { AppDataSource } from "../data-source.js"
import { User } from "../entities/User.js"
import { RefreshToken } from "../entities/RefreshToken.js"
import logger from "../config/logger.js"
import RegisterValidator from "../validators/register-validator.js"
import LoginValidator from "../validators/login-validator.js"
import { CredentialService } from "../services/CredentialService.js"
import { TokenService } from "../services/TokenService.js"
import authenticate from "../middlewares/authenticate.js"
import type { AuthRequest } from "../types/index.js"

const router = express.Router()
const userRepository = AppDataSource.getRepository(User)
const refreshTokenRepository = AppDataSource.getRepository(RefreshToken)
const userService = new UserService(userRepository)
const credentialService = new CredentialService()
const tokenService = new TokenService(refreshTokenRepository)
const authController = new AuthController(
    userService,
    logger,
    credentialService,
    tokenService,
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

router.get("/self", authenticate, (req: Request, res: Response) =>
    authController.self(req as AuthRequest, res),
)

export default router
