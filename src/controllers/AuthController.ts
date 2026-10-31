import type { Request, Response } from "express"
// import { AppDataSource } from "../data-source.js"
// import { User } from "../entities/User.js"
import { UserService } from "../services/UserService.js"
import type { UserData } from "../types/index.js"

interface RegisterUserRequest extends Request {
    body: UserData
}
export class AuthController {
    userService: UserService

    constructor(userService: UserService) {
        this.userService = userService
    }

    async register(req: RegisterUserRequest, res: Response) {
        const { firstname, lastname, email, password } = req.body

        await this.userService.create({ firstname, lastname, email, password })

        res.status(201).json()
    }
}
