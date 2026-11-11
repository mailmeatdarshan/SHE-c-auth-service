import type { NextFunction, Request, Response } from "express"
import type { UserService } from "../services/UserService.js"
import type { JwtPayload } from "jsonwebtoken"
import type { AuthRequest, LoginUserData, UserData } from "../types/index.js"
import type { Logger } from "winston"
import { validationResult } from "express-validator"
import createHttpError from "http-errors"
import type { CredentialService } from "../services/CredentialService.js"
import type { TokenService } from "../services/TokenService.js"

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
        private tokenService: TokenService,
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

            const payload: JwtPayload = {
                sub: String(user.id),
                email: user.email,
                role: user.role,
            }

            const accessToken = this.tokenService.generateAccessToken(payload)
            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user)
            const refreshToken = this.tokenService.generateRefreshToken(
                payload,
                String(newRefreshToken.id),
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

            const payload: JwtPayload = {
                sub: String(user.id),
                email: user.email,
                role: user.role,
            }

            const accessToken = this.tokenService.generateAccessToken(payload)
            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user)
            const refreshToken = this.tokenService.generateRefreshToken(
                payload,
                String(newRefreshToken.id),
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

            res.status(200).json({ id: user.id })
        } catch (err) {
            this.logger.error("Error logging in user")
            next(err)
            return
        }
    }

    async self(req: AuthRequest, res: Response) {
        const user = await this.userService.findById(Number(req.auth.sub))
        res.json(user)
    }

    async refresh(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const payload: JwtPayload = {
                sub: req.auth.sub,
                role: req.auth.role,
            }

            const accessToken = this.tokenService.generateAccessToken(payload)

            const user = await this.userService.findById(Number(req.auth.sub))
            if (!user) {
                const error = createHttpError(
                    400,
                    "User with the token could not find",
                )
                next(error)
                return
            }
            //persist the refresh token
            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user)

            //delete old refresh token
            await this.tokenService.deleteRefreshToken(
                Number(req.auth.id || req.auth.jti),
            )

            const refreshToken = this.tokenService.generateRefreshToken(
                payload,
                String(newRefreshToken.id),
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

            res.status(200).json({ id: user.id })
        } catch (err) {
            this.logger.error("Error refreshing token")
            next(err)
            return
        }
    }
}
