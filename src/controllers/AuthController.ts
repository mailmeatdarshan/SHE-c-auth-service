import type { NextFunction, Request, Response } from "express"
// import { AppDataSource } from "../data-source.js"
// import { User } from "../entities/User.js"
import fs from "fs"
import path from "path"
import { UserService } from "../services/UserService.js"
import jwt from "jsonwebtoken"
import type { JwtPayload } from "jsonwebtoken"
import type { UserData } from "../types/index.js"
import type { Logger } from "winston"
import { validationResult } from "express-validator/lib/validation-result.js"
import createHttpError from "http-errors"
import { Config } from "../config/index.js"
import { AppDataSource } from "../data-source.js"

interface RegisterUserRequest extends Request {
    body: UserData
}
export class AuthController {
    constructor(
        private userService: UserService,
        private logger: Logger,
    ) {}

    async register(
        req: RegisterUserRequest,
        res: Response,
        next: NextFunction,
    ) {
        const result = validationResult(req)
        if (!result.isEmpty()) {
            res.status(400).json({ errors: result.array() })
            return
        }

        const { firstname, lastname, email, password } = req.body
        this.logger.debug("New request to register user", {
            firstname,
            lastname,
            email,
            password: "********",
        })
        try {
            const user = await this.userService.create({
                firstname,
                lastname,
                email,
                password,
            })
            this.logger.info(`User has been registered with ID: ${user.id}`)
            let privateKey: Buffer | string
            try {
                privateKey = fs.readFileSync(
                    path.join(import.meta.dirname, "../../certs/private.pem"),
                    "utf8",
                )
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (err) {
                const error = createHttpError(500, "Private key not found")
                next(error)
                return
            }

            const payload: JwtPayload = {
                sub: String(user.id),
                email: user.email,
                role: user.role,
            }

            const accessToken = jwt.sign(payload, privateKey, {
                expiresIn: "15m",
                algorithm: "RS256",
                issuer: "auth-service",
            })

            // Persist the refresh token in the database
            const refreshTokenRepository =
                AppDataSource.getRepository("RefreshToken")
            const newReferenceToken = await refreshTokenRepository.save({
                user: user,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            })

            const refreshToken = jwt.sign(
                payload,
                Config.REFRESH_TOKEN_SECRET!,
                {
                    algorithm: "HS256",
                    expiresIn: "7d",
                    issuer: "auth-service",
                    jwtid: String(newReferenceToken.id), // Use the ID of the saved refresh token as the JWT ID
                },
            )
            // const accessToken = await this.userService.generateAccessToken(user)
            // const refreshToken = await this.userService.generateRefreshToken(user)

            res.cookie("accessToken", accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 15 * 60 * 1000, // 15 minutes
            })
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            })

            res.status(201).json({ id: user.id })
        } catch (err) {
            this.logger.error("Error creating user")
            next(err)
            return
        }
    }
}
