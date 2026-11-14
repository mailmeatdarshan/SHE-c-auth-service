import { jest } from "@jest/globals"
import { TokenService } from "../../src/services/TokenService.js"
import { Config } from "../../src/config/index.js"
import type { Repository, DeleteResult } from "typeorm"
import { RefreshToken } from "../../src/entities/RefreshToken.js"
import { User } from "../../src/entities/User.js"

describe("TokenService", () => {
    let tokenService: TokenService
    let mockRefreshTokenRepository: jest.Mocked<Repository<RefreshToken>>

    beforeEach(() => {
        mockRefreshTokenRepository = {
            save: jest.fn(),
            delete: jest.fn(),
        } as unknown as jest.Mocked<Repository<RefreshToken>>

        tokenService = new TokenService(mockRefreshTokenRepository)
    })

    describe("generateAccessToken", () => {
        it("should throw 500 error if PRIVATE_KEY is missing", () => {
            const originalKey = Config.PRIVATE_KEY
            Config.PRIVATE_KEY = ""

            expect(() => {
                tokenService.generateAccessToken({ sub: "1", role: "admin" })
            }).toThrow("Private key not found")

            Config.PRIVATE_KEY = originalKey
        })

        it("should generate a valid access token when PRIVATE_KEY is provided", () => {
            const token = tokenService.generateAccessToken({
                sub: "1",
                role: "admin",
            })
            expect(typeof token).toBe("string")
            expect(token.split(".").length).toBe(3)
        })
    })

    describe("generateRefreshToken", () => {
        it("should generate a refresh token", () => {
            const token = tokenService.generateRefreshToken(
                { sub: "1", role: "admin" },
                "123",
            )
            expect(typeof token).toBe("string")
            expect(token.split(".").length).toBe(3)
        })
    })

    describe("persistRefreshToken", () => {
        it("should persist refresh token to database", async () => {
            const user = new User()
            user.id = 1
            const mockToken = new RefreshToken()
            mockToken.id = 1
            mockToken.user = user

            mockRefreshTokenRepository.save.mockResolvedValue(mockToken)

            const result = await tokenService.persistRefreshToken(user)
            expect(result).toBe(mockToken)
            expect(mockRefreshTokenRepository.save.mock.calls.length).toBe(1)
        })
    })

    describe("deleteRefreshToken", () => {
        it("should delete refresh token by id", async () => {
            const mockDeleteResult: DeleteResult = {
                raw: [],
                affected: 1,
            }
            mockRefreshTokenRepository.delete.mockResolvedValue(
                mockDeleteResult,
            )

            const result = await tokenService.deleteRefreshToken(1)
            expect(result.affected).toBe(1)
            expect(
                mockRefreshTokenRepository.delete.mock.calls[0]?.[0],
            ).toEqual({
                id: 1,
            })
        })
    })
})
