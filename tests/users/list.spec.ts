import request from "supertest"
import app from "../../src/app.js"
import type { DataSource } from "typeorm"
import { createJWKSMock } from "mock-jwks"
import { AppDataSource } from "../../src/data-source.js"
import { User } from "../../src/entities/User.js"
import { Roles } from "../../src/constants/index.js"
import { truncateTables } from "../utils/index.js"

interface PaginatedUsersResponse {
    currentPage: number
    perPage: number
    total: number
    data: Array<{
        id: number
        firstname: string
        lastname: string
        email: string
        role: string
        password?: string
    }>
}

describe("GET /users", () => {
    let connection: DataSource
    let jwks: ReturnType<typeof createJWKSMock>

    beforeAll(async () => {
        jwks = createJWKSMock("http://localhost:5001")
        connection = await AppDataSource.initialize()
        await connection.synchronize(true)
    })

    beforeEach(async () => {
        jwks.start()
        await truncateTables(connection)
    })

    afterEach(() => {
        jwks.stop()
    })

    afterAll(async () => {
        if (connection && connection.isInitialized) {
            await connection.destroy()
        }
    })

    describe("Given all fields", () => {
        it("should return 200 status code with paginated users list", async () => {
            const adminToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .get("/users")
                .set("Cookie", [`accessToken=${adminToken};`])
                .send()

            const body = response.body as PaginatedUsersResponse
            expect(response.statusCode).toBe(200)
            expect(body.currentPage).toBe(1)
            expect(body.perPage).toBe(10)
            expect(body.total).toBe(0)
            expect(Array.isArray(body.data)).toBe(true)
        })

        it("should return user list without exposing passwords", async () => {
            const adminToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const userRepository = connection.getRepository(User)
            await userRepository.save({
                firstname: "Darshan",
                lastname: "Dubey",
                email: "darshan@gmail.com",
                password: "hashedpassword123",
                role: Roles.CUSTOMER,
            })

            const response = await request(app)
                .get("/users")
                .set("Cookie", [`accessToken=${adminToken};`])
                .send()

            const body = response.body as PaginatedUsersResponse
            expect(response.statusCode).toBe(200)
            expect(body.total).toBe(1)
            expect(body.data).toHaveLength(1)
            expect(body.data[0]).not.toHaveProperty("password")
            expect(body.data[0]?.email).toBe("darshan@gmail.com")
        })

        it("should paginate correctly with currentPage and perPage", async () => {
            const adminToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const userRepository = connection.getRepository(User)
            for (let i = 1; i <= 5; i++) {
                await userRepository.save({
                    firstname: `User${i}`,
                    lastname: "Test",
                    email: `user${i}@gmail.com`,
                    password: "password123",
                    role: Roles.CUSTOMER,
                })
            }

            const response = await request(app)
                .get("/users?currentPage=2&perPage=2")
                .set("Cookie", [`accessToken=${adminToken};`])
                .send()

            const body = response.body as PaginatedUsersResponse
            expect(response.statusCode).toBe(200)
            expect(body.currentPage).toBe(2)
            expect(body.perPage).toBe(2)
            expect(body.total).toBe(5)
            expect(body.data).toHaveLength(2)
            // Ordered by id DESC: 5, 4 on page 1; 3, 2 on page 2; 1 on page 3
            expect(body.data[0]?.email).toBe("user3@gmail.com")
            expect(body.data[1]?.email).toBe("user2@gmail.com")
        })

        it("should handle edge case query values gracefully (empty string, 0, negative)", async () => {
            const adminToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .get("/users?currentPage=&perPage=")
                .set("Cookie", [`accessToken=${adminToken};`])
                .send()

            const body1 = response.body as PaginatedUsersResponse
            expect(response.statusCode).toBe(200)
            expect(body1.currentPage).toBe(1)
            expect(body1.perPage).toBe(10)

            const response2 = await request(app)
                .get("/users?currentPage=-1&perPage=0")
                .set("Cookie", [`accessToken=${adminToken};`])
                .send()

            const body2 = response2.body as PaginatedUsersResponse
            expect(response2.statusCode).toBe(200)
            expect(body2.currentPage).toBe(1)
            expect(body2.perPage).toBe(10)
        })

        it("should clamp perPage to max 100 to prevent DoS", async () => {
            const adminToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .get("/users?currentPage=1&perPage=1000000")
                .set("Cookie", [`accessToken=${adminToken};`])
                .send()

            const body = response.body as PaginatedUsersResponse
            expect(response.statusCode).toBe(200)
            expect(body.perPage).toBe(100)
        })

        it("should return 403 if non-admin tries to list users", async () => {
            const managerToken = jwks.token({
                sub: "1",
                role: Roles.MANAGER,
            })

            const response = await request(app)
                .get("/users")
                .set("Cookie", [`accessToken=${managerToken};`])
                .send()

            expect(response.statusCode).toBe(403)
        })

        it("should return 401 if unauthenticated", async () => {
            const response = await request(app).get("/users").send()

            expect(response.statusCode).toBe(401)
        })
    })
})
