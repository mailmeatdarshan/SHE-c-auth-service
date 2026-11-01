import type { NextFunction, Request, Response } from "express"
// import { AppDataSource } from "../data-source.js"
// import { User } from "../entities/User.js"
import { UserService } from "../services/UserService.js"
import type { UserData } from "../types/index.js"
import type { Logger } from "winston"

interface RegisterUserRequest extends Request {
    body: UserData
}
export class AuthController {
    constructor(
        private userService: UserService,
        private logger: Logger,
    ) {}

    async register(
        req: RegisterUserRequest,
        res: Response,
        next: NextFunction,
    ) {
        const { firstname, lastname, email, password } = req.body
        this.logger.debug("New request to register user", {
            firstname,
            lastname,
            email,
            password: "********",
        })
        try {
            const user = await this.userService.create({
                firstname,
                lastname,
                email,
                password,
            })
            this.logger.info(`User has been registered with ID: ${user.id}`)
            res.status(201).json({ id: user.id })
        } catch (err) {
            this.logger.error("Error creating user")
            next(err)
            return
        }
    }
}
