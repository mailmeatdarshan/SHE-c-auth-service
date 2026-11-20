import express, {
    type NextFunction,
    type Request,
    type Response,
} from "express"
import { UserController } from "../controllers/UserController.js"
import authenticate from "../middlewares/authenticate.js"
import { canAccess } from "../middlewares/canAccess.js"
import { Roles } from "../constants/index.js"
import { UserService } from "../services/UserService.js"
import { AppDataSource } from "../data-source.js"
import { User } from "../entities/User.js"
import type { CreateUserRequest } from "../types/index.js"
import listUsersValidator from "../validators/list-users-validator.js"

const router = express.Router()

const userRepository = AppDataSource.getRepository(User)
const userService = new UserService(userRepository)
const userController = new UserController(userService)

router.post(
    "/",
    authenticate,
    canAccess([Roles.ADMIN]),
    (req: Request, res: Response, next: NextFunction) =>
        userController.create(req as CreateUserRequest, res, next),
)

router.get(
    "/",
    authenticate,
    canAccess([Roles.ADMIN]),
    listUsersValidator,
    (req: Request, res: Response, next: NextFunction) =>
        userController.getAll(req, res, next),
)

export default router
