import express, { type NextFunction } from "express"
import type { Request, Response } from "express"
import { AuthController } from "../controllers/AuthController.js"
import { UserService } from "../services/UserService.js"
import { AppDataSource } from "../data-source.js"
import { User } from "../entities/User.js"
import logger from "../config/logger.js"
import RegisterValidator from "../validators/register-validator.js"

const router = express.Router()
const userRepository = AppDataSource.getRepository(User)
const userService = new UserService(userRepository)
const authController = new AuthController(userService, logger)

router.post(
    "/register",
    RegisterValidator,
    (req: Request, res: Response, next: NextFunction) =>
        authController.register(req, res, next),
)

export default router
