import request from "supertest"
import app from "../../src/app.js"
import type { DataSource } from "typeorm"
import { createJWKSMock } from "mock-jwks"
import { AppDataSource } from "../../src/data-source.js"
import { User } from "../../src/entities/User.js"
import { Roles } from "../../src/constants/index.js"
import { truncateTables } from "../utils/index.js" //isJWT
// import bcrypt from "bcrypt"

describe("GET /auth/self", () => {
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
        it("should return 200 status code", async () => {
            const accessToken = jwks.token({ sub: "1", role: Roles.CUSTOMER })

            const response = await request(app)
                .get("/auth/self")
                .set("Cookie", [`accessToken=${accessToken};`])
                .send()

            expect(response.statusCode).toBe(200)
        })

        it("should return the user data", async () => {
            const userData = {
                firstname: "Darshan",
                lastname: "Dubey",
                email: "darshan@gmail.com",
                password: "secret123",
            }

            const userRepository = connection.getRepository(User)
            const data = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            })

            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            })

            const response = await request(app)
                .get("/auth/self")
                .set("Cookie", [`accessToken=${accessToken};`])
                .send()

            expect((response.body as Record<string, string>).id).toBe(data.id)
            expect(response.body).not.toHaveProperty("password")
        })
    })

    describe("Fields are missing", () => {})

    describe("Invalid email format", () => {})
})
