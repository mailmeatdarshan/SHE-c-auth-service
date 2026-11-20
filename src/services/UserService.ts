import type { Repository } from "typeorm"
import { User } from "../entities/User.js"
import type { ListUsersQuery, UserData } from "../types/index.js"
import createHttpError from "http-errors"
import bcrypt from "bcryptjs"

export class UserService {
    constructor(private userRepository: Repository<User>) {}
    async create({ firstname, lastname, email, password, role }: UserData) {
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
                role,
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

    async getAll(validatedQuery: ListUsersQuery) {
        const queryBuilder = this.userRepository.createQueryBuilder("user")
        return await queryBuilder
            .select([
                "user.id",
                "user.firstname",
                "user.lastname",
                "user.email",
                "user.role",
            ])
            .orderBy("user.id", "DESC")
            .skip((validatedQuery.currentPage - 1) * validatedQuery.perPage)
            .take(validatedQuery.perPage)
            .getManyAndCount()
    }
}
