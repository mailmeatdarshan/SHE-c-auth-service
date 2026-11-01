import express from "express"
import { AuthController } from "../controllers/AuthController.js"
import { UserService } from "../services/UserService.js"
import { AppDataSource } from "../data-source.js"
import { User } from "../entities/User.js"
import logger from "../config/logger.js"

const router = express.Router()
const userRepository = AppDataSource.getRepository(User)
const userService = new UserService(userRepository)
const authController = new AuthController(userService, logger)

router.post("/register", (req, res, next) =>
    authController.register(req, res, next),
)

export default router
