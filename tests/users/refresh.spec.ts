import request from "supertest"
import jwt from "jsonwebtoken"
import app from "../../src/app.js"
import type { DataSource } from "typeorm"
import { AppDataSource } from "../../src/data-source.js"
import { User } from "../../src/entities/User.js"
import { RefreshToken } from "../../src/entities/RefreshToken.js"
import { Roles } from "../../src/constants/index.js"
import { Config } from "../../src/config/index.js"
import { isJWT, truncateTables } from "../utils/index.js"

describe("POST /auth/refresh", () => {
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
        await connection.destroy()
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
                .post("/auth/refresh")
                .set("Cookie", [`refreshToken=${refreshToken};`])
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
                .post("/auth/refresh")
                .set("Cookie", [`refreshToken=${refreshToken};`])
                .send()

            //Assert application/json
            expect(
                (response.headers as Record<string, string>)["content-type"],
            ).toEqual(expect.stringContaining("json"))
        })

        it("should return an ID of the user", async () => {
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
                .post("/auth/refresh")
                .set("Cookie", [`refreshToken=${refreshToken};`])
                .send()

            //Assert
            expect((response.body as Record<string, string>).id).toBe(user.id)
        })

        it("should return new access token and refresh token inside a cookie", async () => {
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

            const oldRefreshToken = jwt.sign(
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
                .post("/auth/refresh")
                .set("Cookie", [`refreshToken=${oldRefreshToken};`])
                .send()

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
            expect(refreshToken).not.toBe(oldRefreshToken)

            expect(isJWT(accessToken)).toBeTruthy()
            expect(isJWT(refreshToken)).toBeTruthy()
        })

        it("should persist the new refresh token and delete the old refresh token from the database", async () => {
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
                .post("/auth/refresh")
                .set("Cookie", [`refreshToken=${refreshToken};`])
                .send()

            //Assert
            const oldToken = await refreshTokenRepository.findOne({
                where: { id: savedRefreshToken.id },
            })
            expect(oldToken).toBeNull()

            const tokens = await refreshTokenRepository
                .createQueryBuilder("refreshToken")
                .where("refreshToken.userId = :userId", {
                    userId: user.id,
                })
                .getMany()
            expect(tokens).toHaveLength(1)
            expect(tokens[0]?.id).not.toBe(savedRefreshToken.id)
        })
    })

    describe("Tokens are missing or invalid", () => {
        it("should return 401 status code if refresh token is missing", async () => {
            //Act
            const response = await request(app).post("/auth/refresh").send()

            //Assert
            expect(response.statusCode).toBe(401)
        })

        it("should return 401 status code if refresh token is invalid", async () => {
            //Act
            const response = await request(app)
                .post("/auth/refresh")
                .set("Cookie", ["refreshToken=invalid.refresh.token;"])
                .send()

            //Assert
            expect(response.statusCode).toBe(401)
        })

        it("should return 401 status code if refresh token is expired", async () => {
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

            const expiredRefreshToken = jwt.sign(
                {
                    sub: String(user.id),
                    role: user.role,
                    id: String(savedRefreshToken.id),
                },
                Config.REFRESH_TOKEN_SECRET!,
                {
                    algorithm: "HS256",
                    expiresIn: -10,
                    issuer: "auth-service",
                    jwtid: String(savedRefreshToken.id),
                },
            )

            //Act
            const response = await request(app)
                .post("/auth/refresh")
                .set("Cookie", [`refreshToken=${expiredRefreshToken};`])
                .send()

            //Assert
            expect(response.statusCode).toBe(401)
        })

        it("should return 401 status code if refresh token is revoked", async () => {
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

            const refreshToken = jwt.sign(
                {
                    sub: String(user.id),
                    role: user.role,
                    id: "999",
                },
                Config.REFRESH_TOKEN_SECRET!,
                {
                    algorithm: "HS256",
                    expiresIn: "7d",
                    issuer: "auth-service",
                    jwtid: "999",
                },
            )

            //Act
            const response = await request(app)
                .post("/auth/refresh")
                .set("Cookie", [`refreshToken=${refreshToken};`])
                .send()

            //Assert
            expect(response.statusCode).toBe(401)
        })
    })
})
