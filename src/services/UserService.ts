import type { Repository } from "typeorm"
import { User } from "../entities/User.js"
import type { UserData } from "../types/index.js"
import { Roles } from "../constants/index.js"
import createHttpError from "http-errors"
import bcrypt from "bcrypt"

export class UserService {
    constructor(private userRepository: Repository<User>) {}
    async create({ firstname, lastname, email, password }: UserData) {
        const existingUser = await this.userRepository.findOne({
            where: { email },
        })
        if (existingUser) {
            throw createHttpError(409, "Email already exists")
        }

        //Hash the password
        const saltRounds = 10
        const hashedPassword = await bcrypt.hash(password, saltRounds)

        try {
            return await this.userRepository.save({
                firstname,
                lastname,
                email,
                password: hashedPassword,
                role: Roles.CUSTOMER, // Assigning default role as CUSTOMER
            })
        } catch {
            const error = createHttpError(500, "Error creating user")
            throw error
        }
    }

    async findByEmail(email: string) {
        return await this.userRepository.findOne({
            where: { email },
        })
    }

    async findById(id: number) {
        return await this.userRepository.findOne({
            where: { id },
            select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true,
                role: true,
            },
        })
    }
}
