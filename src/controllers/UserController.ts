import type { NextFunction, Request, Response } from "express"
import type { UserService } from "../services/UserService.js"
import type { CreateUserRequest, ListUsersQuery } from "../types/index.js"
import { Roles } from "../constants/index.js"
import { matchedData } from "express-validator"

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

    async getAll(req: Request, res: Response, next: NextFunction) {
        const validatedQuery = matchedData<ListUsersQuery>(req, {
            onlyValidData: true,
        })

        try {
            const [users, count] = await this.userService.getAll(validatedQuery)
            res.json({
                currentPage: validatedQuery.currentPage,
                perPage: validatedQuery.perPage,
                total: count,
                data: users,
            })
        } catch (error) {
            next(error)
        }
    }
}
