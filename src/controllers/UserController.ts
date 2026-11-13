import type { NextFunction, Response } from "express"
import type { UserService } from "../services/UserService.js"
import type { CreateUserRequest } from "../types/index.js"
import { Roles } from "../constants/index.js"

export class UserController {
    constructor(private userService: UserService) {}
    async create(req: CreateUserRequest, res: Response, next: NextFunction) {
        const { firstname, lastname, email, password } = req.body
        try {
            const user = await this.userService.create({
                firstname,
                lastname,
                email,
                password,
                role: Roles.MANAGER,
            })
            res.status(201).json({ id: user.id })
        } catch (error) {
            next(error)
        }
    }
}
