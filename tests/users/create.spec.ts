import request from "supertest"
import app from "../../src/app.js"
import type { DataSource } from "typeorm"
import { createJWKSMock } from "mock-jwks"
import { AppDataSource } from "../../src/data-source.js"
import { User } from "../../src/entities/User.js"
import { Roles } from "../../src/constants/index.js"
import { truncateTables } from "../utils/index.js" //isJWT
// import bcrypt from "bcrypt"

describe("POST /users", () => {
    let connection: DataSource
    let jwks: ReturnType<typeof createJWKSMock>

    beforeAll(async () => {
        jwks = createJWKSMock("http://localhost:5001")
        connection = await AppDataSource.initialize()
        await connection.synchronize(true)
    })

    beforeEach(async () => {
        // DB truncate
        jwks.start()
        await truncateTables(connection)
    })

    afterEach(() => {
        jwks.stop()
    })

    afterAll(async () => {
        await connection.destroy()
    })

    describe("Given all fields", () => {
        it("should return 201 status code", async () => {
            const adminToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const userData = {
                firstname: "Darshan",
                lastname: "Dubey",
                email: "darshan@gmail.com",
                password: "secret123",
            }

            const response = await request(app)
                .post("/users")
                .set("Cookie", [`accessToken=${adminToken};`])
                .send(userData)

            expect(response.statusCode).toBe(201)
        })

        it("should persist the user in the database", async () => {
            const adminToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const userData = {
                firstname: "Darshan",
                lastname: "Dubey",
                email: "darshan@gmail.com",
                password: "secret123",
            }

            await request(app)
                .post("/users")
                .set("Cookie", [`accessToken=${adminToken};`])
                .send(userData)

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(users).toHaveLength(1)
            expect(users.map((user) => user.email)).toContain(userData.email)
        })

        it("should create a manager user", async () => {
            const adminToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const userData = {
                firstname: "Darshan",
                lastname: "Dubey",
                email: "darshan@gmail.com",
                password: "secret123",
            }

            await request(app)
                .post("/users")
                .set("Cookie", [`accessToken=${adminToken};`])
                .send(userData)

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(users).toHaveLength(1)
            expect(users.map((user) => user.role)).toContain(Roles.MANAGER)
        })

        it("should return 403 if non admin user tries to create a user", async () => {
            const nonAdminToken = jwks.token({
                sub: "1",
                role: Roles.MANAGER,
            })

            const userData = {
                firstname: "Darshan",
                lastname: "Dubey",
                email: "darshan@gmail.com",
                password: "secret123",
            }

            const response = await request(app)
                .post("/users")
                .set("Cookie", [`accessToken=${nonAdminToken};`])
                .send(userData)

            expect(response.statusCode).toBe(403)

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users).toHaveLength(0)
        })
    })
})
