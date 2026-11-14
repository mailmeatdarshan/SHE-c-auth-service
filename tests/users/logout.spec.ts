import request from "supertest"
import jwt from "jsonwebtoken"
import app from "../../src/app.js"
import type { DataSource } from "typeorm"
import { createJWKSMock } from "mock-jwks"
import { AppDataSource } from "../../src/data-source.js"
import { User } from "../../src/entities/User.js"
import { RefreshToken } from "../../src/entities/RefreshToken.js"
import { Roles } from "../../src/constants/index.js"
import { Config } from "../../src/config/index.js"
import { truncateTables } from "../utils/index.js"

describe("POST /auth/logout", () => {
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
        if (connection && connection.isInitialized) {
            await connection.destroy()
        }
    })

    describe("Given all fields", () => {
        it("should return 200 status code", async () => {
            //Arrange
            const userData = {
                firstname: "Darshan",
                lastname: "Dubey",
                email: "darshan@gmail.com",
                password: "secret123",
            }

            const userRepository = connection.getRepository(User)
            const user = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            })

            const refreshTokenRepository =
                connection.getRepository(RefreshToken)
            const savedRefreshToken = await refreshTokenRepository.save({
                user,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            })

            const accessToken = jwks.token({
                sub: String(user.id),
                role: user.role,
            })

            const refreshToken = jwt.sign(
                {
                    sub: String(user.id),
                    role: user.role,
                    id: String(savedRefreshToken.id),
                },
                Config.REFRESH_TOKEN_SECRET!,
                {
                    algorithm: "HS256",
                    expiresIn: "7d",
                    issuer: "auth-service",
                    jwtid: String(savedRefreshToken.id),
                },
            )

            //Act
            const response = await request(app)
                .post("/auth/logout")
                .set("Cookie", [
                    `accessToken=${accessToken};`,
                    `refreshToken=${refreshToken};`,
                ])
                .send()

            //Assert
            expect(response.statusCode).toBe(200)
        })

        it("should return valid json response", async () => {
            //Arrange
            const userData = {
                firstname: "Darshan",
                lastname: "Dubey",
                email: "darshan@gmail.com",
                password: "secret123",
            }

            const userRepository = connection.getRepository(User)
            const user = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            })

            const refreshTokenRepository =
                connection.getRepository(RefreshToken)
            const savedRefreshToken = await refreshTokenRepository.save({
                user,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            })

            const accessToken = jwks.token({
                sub: String(user.id),
                role: user.role,
            })

            const refreshToken = jwt.sign(
                {
                    sub: String(user.id),
                    role: user.role,
                    id: String(savedRefreshToken.id),
                },
                Config.REFRESH_TOKEN_SECRET!,
                {
                    algorithm: "HS256",
                    expiresIn: "7d",
                    issuer: "auth-service",
                    jwtid: String(savedRefreshToken.id),
                },
            )

            //Act
            const response = await request(app)
                .post("/auth/logout")
                .set("Cookie", [
                    `accessToken=${accessToken};`,
                    `refreshToken=${refreshToken};`,
                ])
                .send()

            //Assert application/json
            expect(
                (response.headers as Record<string, string>)["content-type"],
            ).toEqual(expect.stringContaining("json"))
            expect((response.body as Record<string, string>).message).toBe(
                "User has been logged out",
            )
        })

        it("should clear the access token and refresh token cookies", async () => {
            //Arrange
            const userData = {
                firstname: "Darshan",
                lastname: "Dubey",
                email: "darshan@gmail.com",
                password: "secret123",
            }

            const userRepository = connection.getRepository(User)
            const user = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            })

            const refreshTokenRepository =
                connection.getRepository(RefreshToken)
            const savedRefreshToken = await refreshTokenRepository.save({
                user,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            })

            const accessToken = jwks.token({
                sub: String(user.id),
                role: user.role,
            })

            const refreshToken = jwt.sign(
                {
                    sub: String(user.id),
                    role: user.role,
                    id: String(savedRefreshToken.id),
                },
                Config.REFRESH_TOKEN_SECRET!,
                {
                    algorithm: "HS256",
                    expiresIn: "7d",
                    issuer: "auth-service",
                    jwtid: String(savedRefreshToken.id),
                },
            )

            //Act
            const response = await request(app)
                .post("/auth/logout")
                .set("Cookie", [
                    `accessToken=${accessToken};`,
                    `refreshToken=${refreshToken};`,
                ])
                .send()

            interface Headers {
                ["set-cookie"]?: string[]
            }

            //Assert
            let clearedAccessToken: string | null = null
            let clearedRefreshToken: string | null = null

            expect(response.status).toBe(200)
            const cookies = (response.headers as Headers)["set-cookie"] || []

            cookies.forEach((cookie) => {
                if (cookie.startsWith("accessToken=")) {
                    clearedAccessToken =
                        cookie.split(";")[0]?.split("=")[1] ?? null
                }

                if (cookie.startsWith("refreshToken=")) {
                    clearedRefreshToken =
                        cookie.split(";")[0]?.split("=")[1] ?? null
                }
            })

            expect(clearedAccessToken).toBe("")
            expect(clearedRefreshToken).toBe("")
        })

        it("should delete the refresh token from the database", async () => {
            //Arrange
            const userData = {
                firstname: "Darshan",
                lastname: "Dubey",
                email: "darshan@gmail.com",
                password: "secret123",
            }

            const userRepository = connection.getRepository(User)
            const user = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            })

            const refreshTokenRepository =
                connection.getRepository(RefreshToken)
            const savedRefreshToken = await refreshTokenRepository.save({
                user,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            })

            const accessToken = jwks.token({
                sub: String(user.id),
                role: user.role,
            })

            const refreshToken = jwt.sign(
                {
                    sub: String(user.id),
                    role: user.role,
                    id: String(savedRefreshToken.id),
                },
                Config.REFRESH_TOKEN_SECRET!,
                {
                    algorithm: "HS256",
                    expiresIn: "7d",
                    issuer: "auth-service",
                    jwtid: String(savedRefreshToken.id),
                },
            )

            //Act
            await request(app)
                .post("/auth/logout")
                .set("Cookie", [
                    `accessToken=${accessToken};`,
                    `refreshToken=${refreshToken};`,
                ])
                .send()

            //Assert
            const tokens = await refreshTokenRepository
                .createQueryBuilder("refreshToken")
                .where("refreshToken.userId = :userId", {
                    userId: user.id,
                })
                .getMany()
            expect(tokens).toHaveLength(0)
        })
    })

    describe("Tokens are missing or invalid", () => {
        it("should return 401 status code if access token is missing", async () => {
            //Arrange
            const refreshToken = jwt.sign(
                {
                    sub: "1",
                    role: Roles.CUSTOMER,
                    id: "1",
                },
                Config.REFRESH_TOKEN_SECRET!,
                {
                    algorithm: "HS256",
                    expiresIn: "7d",
                    issuer: "auth-service",
                    jwtid: "1",
                },
            )

            //Act
            const response = await request(app)
                .post("/auth/logout")
                .set("Cookie", [`refreshToken=${refreshToken};`])
                .send()

            //Assert
            expect(response.statusCode).toBe(401)
        })

        it("should return 401 status code if refresh token is missing", async () => {
            //Arrange
            const accessToken = jwks.token({
                sub: "1",
                role: Roles.CUSTOMER,
            })

            //Act
            const response = await request(app)
                .post("/auth/logout")
                .set("Cookie", [`accessToken=${accessToken};`])
                .send()

            //Assert
            expect(response.statusCode).toBe(401)
        })

        it("should return 401 status code if both tokens are missing", async () => {
            //Act
            const response = await request(app).post("/auth/logout").send()

            //Assert
            expect(response.statusCode).toBe(401)
        })

        it("should return 401 status code if refresh token is invalid", async () => {
            //Arrange
            const accessToken = jwks.token({
                sub: "1",
                role: Roles.CUSTOMER,
            })

            //Act
            const response = await request(app)
                .post("/auth/logout")
                .set("Cookie", [
                    `accessToken=${accessToken};`,
                    "refreshToken=invalid.refresh.token;",
                ])
                .send()

            //Assert
            expect(response.statusCode).toBe(401)
        })
    })
})
