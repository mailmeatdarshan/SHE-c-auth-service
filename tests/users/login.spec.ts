import request from "supertest"
import app from "../../src/app.js"
import type { DataSource } from "typeorm"
import { AppDataSource } from "../../src/data-source.js"
import { User } from "../../src/entities/User.js"
import { Roles } from "../../src/constants/index.js"
import { isJWT, truncateTables } from "../utils/index.js"
import bcrypt from "bcryptjs"

describe("POST /auth/login", () => {
    let connection: DataSource

    beforeAll(async () => {
        connection = await AppDataSource.initialize()
        await connection.synchronize(true)
    })

    beforeEach(async () => {
        // DB truncate
        await truncateTables(connection)
    })

    afterAll(async () => {
        if (connection && connection.isInitialized) {
            await connection.destroy()
        }
    })

    describe("Given all fields", () => {
        it("should return 200 status code", async () => {
            ///AAA

            //Arrange
            const userData = {
                firstname: "Darshan",
                lastname: "Dubey",
                email: "darshan@gmail.com",
                password: "secret123",
            }

            const hashedPassword = await bcrypt.hash(userData.password, 10)
            const userRepository = connection.getRepository(User)
            await userRepository.save({
                ...userData,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            })

            //Act
            const response = await request(app).post("/auth/login").send({
                email: userData.email,
                password: userData.password,
            })

            //Assert
            expect(response.statusCode).toBe(200)
        })

        it("should return valid json response", async () => {
            ///AAA

            //Arrange
            const userData = {
                firstname: "Darshan",
                lastname: "Dubey",
                email: "darshan@gmail.com",
                password: "secret123",
            }

            const hashedPassword = await bcrypt.hash(userData.password, 10)
            const userRepository = connection.getRepository(User)
            await userRepository.save({
                ...userData,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            })

            //Act
            const response = await request(app).post("/auth/login").send({
                email: userData.email,
                password: userData.password,
            })

            //Assert application/json
            expect(
                (response.headers as Record<string, string>)["content-type"],
            ).toEqual(expect.stringContaining("json"))
        })

        it("should return an ID of the logged-in user", async () => {
            //Arrange
            const userData = {
                firstname: "Darshan",
                lastname: "Dubey",
                email: "darshan@gmail.com",
                password: "secret123",
            }

            const hashedPassword = await bcrypt.hash(userData.password, 10)
            const userRepository = connection.getRepository(User)
            await userRepository.save({
                ...userData,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            })

            //Act
            const response = await request(app).post("/auth/login").send({
                email: userData.email,
                password: userData.password,
            })

            //Assert
            expect((response.body as Record<string, string>).id).toBeDefined()
        })

        it("should return the access token and refresh token inside a cookie", async () => {
            //Arrange
            const userData = {
                firstname: "Darshan",
                lastname: "Dubey",
                email: "darshan@gmail.com",
                password: "secret123",
            }

            const hashedPassword = await bcrypt.hash(userData.password, 10)
            const userRepository = connection.getRepository(User)
            await userRepository.save({
                ...userData,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            })

            //Act
            const response = await request(app).post("/auth/login").send({
                email: userData.email,
                password: userData.password,
            })

            interface Headers {
                ["set-cookie"]?: string[]
            }
            //Assert
            let accessToken: string | null = null
            let refreshToken: string | null = null

            expect(response.status).toBe(200)
            const cookies = (response.headers as Headers)["set-cookie"] || []

            cookies.forEach((cookie) => {
                if (cookie.startsWith("accessToken=")) {
                    accessToken = cookie.split(";")[0]?.split("=")[1] ?? null
                }

                if (cookie.startsWith("refreshToken=")) {
                    refreshToken = cookie.split(";")[0]?.split("=")[1] ?? null
                }
            })
            expect(accessToken).not.toBeNull()
            expect(refreshToken).not.toBeNull()

            expect(isJWT(accessToken)).toBeTruthy()
            expect(isJWT(refreshToken)).toBeTruthy()
        })

        it("should store the refresh token in the database", async () => {
            //Arrange
            const userData = {
                firstname: "Darshan",
                lastname: "Dubey",
                email: "darshan@gmail.com",
                password: "secret123",
            }

            const hashedPassword = await bcrypt.hash(userData.password, 10)
            const userRepository = connection.getRepository(User)
            await userRepository.save({
                ...userData,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            })

            //Act
            const response = await request(app).post("/auth/login").send({
                email: userData.email,
                password: userData.password,
            })

            //Assert
            const refreshTokenRepository =
                connection.getRepository("RefreshToken")
            const tokens = await refreshTokenRepository
                .createQueryBuilder("refreshToken")
                .where("refreshToken.userId = :userId", {
                    userId: (response.body as Record<string, string>).id,
                })
                .getMany()
            expect(tokens).toHaveLength(1)
        })

        it("should return 400 status code if user does not exist", async () => {
            //Arrange
            const userData = {
                email: "nonexistent@gmail.com",
                password: "secret123",
            }

            //Act
            const response = await request(app)
                .post("/auth/login")
                .send(userData)

            //Assert
            expect(response.status).toBe(400)
        })

        it("should return 400 status code if password does not match", async () => {
            //Arrange
            const userData = {
                firstname: "Darshan",
                lastname: "Dubey",
                email: "darshan@gmail.com",
                password: "secret123",
            }

            const hashedPassword = await bcrypt.hash(userData.password, 10)
            const userRepository = connection.getRepository(User)
            await userRepository.save({
                ...userData,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            })

            //Act
            const response = await request(app).post("/auth/login").send({
                email: userData.email,
                password: "wrongpassword",
            })

            //Assert
            expect(response.status).toBe(400)
        })
    })

    describe("Fields are missing", () => {
        it("should return 400 status code if email field is missing", async () => {
            //Arrange
            const userData = {
                password: "secret123",
            }

            //Act
            const response = await request(app)
                .post("/auth/login")
                .send(userData)

            //Assert
            expect(response.status).toBe(400)
        })

        it("should return 400 status code if password is missing", async () => {
            //Arrange
            const userData = {
                email: "darshan@gmail.com",
            }

            //Act
            const response = await request(app)
                .post("/auth/login")
                .send(userData)

            //Assert
            expect(response.status).toBe(400)
        })
    })

    describe("Invalid email format", () => {
        it("should trim the email field", async () => {
            //Arrange
            const userData = {
                firstname: "Darshan",
                lastname: "Dubey",
                email: "darshan@gmail.com",
                password: "secret123",
            }

            const hashedPassword = await bcrypt.hash(userData.password, 10)
            const userRepository = connection.getRepository(User)
            await userRepository.save({
                ...userData,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            })

            //Act
            const response = await request(app).post("/auth/login").send({
                email: " darshan@gmail.com ",
                password: "secret123",
            })

            //Assert
            expect(response.statusCode).toBe(200)
        })

        it("should return 400 status code if email format is invalid", async () => {
            //Arrange
            const userData = {
                email: "invalid-email",
                password: "secret123",
            }

            //Act
            const response = await request(app)
                .post("/auth/login")
                .send(userData)

            //Assert
            expect(response.status).toBe(400)
        })

        it("should return an array of error messages if email is missing", async () => {
            //Arrange
            const userData = {
                password: "secret123",
            }

            //Act
            const response = await request(app)
                .post("/auth/login")
                .send(userData)

            //Assert
            expect(response.status).toBe(400)
            expect(response.body).toHaveProperty("errors")
            expect(
                Array.isArray((response.body as { errors: unknown[] }).errors),
            ).toBe(true)
            expect(
                (response.body as { errors: unknown[] }).errors.length,
            ).toBeGreaterThan(0)
        })
    })
})
