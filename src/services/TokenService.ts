import type { Repository } from "typeorm"
import fs from "fs"
import path from "path"
import jwt from "jsonwebtoken"
import type { JwtPayload } from "jsonwebtoken"
import createHttpError from "http-errors"
import { Config } from "../config/index.js"
import { RefreshToken } from "../entities/RefreshToken.js"
import { User } from "../entities/User.js"

export class TokenService {
    constructor(private refreshTokenRepository: Repository<RefreshToken>) {}

    generateAccessToken(payload: JwtPayload): string {
        let privateKey: Buffer | string
        try {
            privateKey = fs.readFileSync(
                path.join(import.meta.dirname, "../../certs/private.pem"),
                "utf8",
            )
        } catch {
            const error = createHttpError(500, "Private key not found")
            throw error
        }

        const accessToken = jwt.sign(payload, privateKey, {
            expiresIn: "15m",
            algorithm: "RS256",
            issuer: "auth-service",
        })

        return accessToken
    }

    generateRefreshToken(payload: JwtPayload, jwtId: string): string {
        const refreshToken = jwt.sign(
            { ...payload, id: jwtId },
            Config.REFRESH_TOKEN_SECRET!,
            {
                algorithm: "HS256",
                expiresIn: "7d",
                issuer: "auth-service",
                jwtid: jwtId,
            },
        )

        return refreshToken
    }

    async persistRefreshToken(user: User) {
        const MS_IN_7_DAYS = 7 * 24 * 60 * 60 * 1000
        const newRefreshToken = await this.refreshTokenRepository.save({
            user: user,
            expiresAt: new Date(Date.now() + MS_IN_7_DAYS),
        })

        return newRefreshToken
    }

    async deleteRefreshToken(tokenId: number) {
        return await this.refreshTokenRepository.delete({ id: tokenId })
    }
}
