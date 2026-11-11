import { expressjwt } from "express-jwt"
import { Config } from "../config/index.js"
import type { Request } from "express"
import type { AuthCookie, IRefreshTokenPayload } from "../types/index.js"
import { AppDataSource } from "../data-source.js"
import { RefreshToken } from "../entities/RefreshToken.js"
// import type { Jwt } from "jsonwebtoken";
import logger from "../config/logger.js"

export default expressjwt({
    secret: Config.REFRESH_TOKEN_SECRET!,
    algorithms: ["HS256"],
    getToken(req: Request) {
        const { refreshToken } = req.cookies as AuthCookie
        return refreshToken
    },

    async isRevoked(request: Request, token) {
        try {
            const refreshTokenRepository =
                AppDataSource.getRepository(RefreshToken)
            const payload = token?.payload as IRefreshTokenPayload
            const tokenId =
                payload?.id || (token?.payload as { jti?: string })?.jti
            const refreshToken = await refreshTokenRepository.findOne({
                where: {
                    id: Number(tokenId),
                    // eslint-disable-next-line @typescript-eslint/unbound-method
                    user: { id: Number(token?.payload.sub) },
                },
            })
            return refreshToken === null
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            logger.error("Error while getting the refresh token", {
                id:
                    (token?.payload as IRefreshTokenPayload)?.id ||
                    (token?.payload as { jti?: string })?.jti,
            })
        }
        return true
    },
})
