 
 
import type { NextFunction, Request, Response } from "express"
import fs from "fs"
import path from "path"
import { UserService } from "../services/UserService.js"
import jwt from "jsonwebtoken"
import type { JwtPayload } from "jsonwebtoken"
import type { LoginUserData, UserData } from "../types/index.js"
import type { Logger } from "winston"
import { validationResult } from "express-validator"
import createHttpError from "http-errors"
import { Config } from "../config/index.js"
import { AppDataSource } from "../data-source.js"
import { RefreshToken } from "../entities/RefreshToken.js"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import bcrypt from "bcrypt"
import type { CredentialService } from "../services/CredentialService.js"

interface RegisterUserRequest extends Request {
    body: UserData
}

interface LoginUserRequest extends Request {
    body: LoginUserData
}
export class AuthController {
    constructor(
        private userService: UserService,
        private logger: Logger,
        private credentialService: CredentialService,
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
            } catch {
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
                AppDataSource.getRepository(RefreshToken)
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

    async login(req: LoginUserRequest, res: Response, next: NextFunction) {
        const result = validationResult(req)
        if (!result.isEmpty()) {
            res.status(400).json({ errors: result.array() })
            return
        }

        const { email, password } = req.body
        this.logger.debug("New request to login user", {
            email,
            password: "********",
        })

        //Check if username(email) exists in the database
        //compare the password with the hashed password in the database
        //generate access token and refresh token
        //add tokens to cookies and send response
        //return the response with the user id

        try {
            const user = await this.userService.findByEmail(email)
            if (!user) {
                const error = createHttpError(
                    400,
                    "Email or password does not match",
                )
                next(error)
                return
            }

            const isPasswordMatch =
                await this.credentialService.comparePassword(
                    password,
                    user.password,
                )
            if (!isPasswordMatch) {
                const error = createHttpError(
                    400,
                    "Email or password does not match",
                )
                next(error)
                return
            }

            this.logger.info(`User has been logged in with ID: ${user.id}`)

            let privateKey: Buffer | string
            try {
                privateKey = fs.readFileSync(
                    path.join(import.meta.dirname, "../../certs/private.pem"),
                    "utf8",
                )
            } catch {
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
                AppDataSource.getRepository(RefreshToken)
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
                    jwtid: String(newReferenceToken.id),
                },
            )

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

            this.logger.info(`User has been logged in with ID: ${user.id}`)
            res.status(200).json({ id: user.id })
        } catch (err) {
            this.logger.error("Error logging in user")
            next(err)
            return
        }
    }
}
