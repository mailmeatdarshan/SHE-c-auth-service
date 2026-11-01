import type { Repository } from "typeorm"
import { User } from "../entities/User.js"
import type { UserData } from "../types/index.js"
import { Roles } from "../constants/index.js"

export class UserService {
    constructor(private userRepository: Repository<User>) {}
    async create({ firstname, lastname, email, password }: UserData) {
        return await this.userRepository.save({
            firstname,
            lastname,
            email,
            password,
            role: Roles.CUSTOMER, // Assigning default role as CUSTOMER
        })
    }
}
