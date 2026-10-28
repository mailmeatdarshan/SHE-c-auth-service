import express, {
    type NextFunction,
    type Request,
    type Response,
} from "express"
import logger from "./config/logger.js"
import type { HttpError } from "http-errors"
import createHttpError from "http-errors"
import authRouter from "./routes/auth.js"
import "reflect-metadata"

const app = express()

app.get("/", (req, res) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const err = createHttpError(401, "You cant access this route")

    res.send("Welcome to auth service")
})

app.use("/auth", authRouter)

// global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message)
    const statusCode = err.statusCode || 500

    res.status(statusCode).json({
        errors: [
            {
                type: err.name,
                msg: err.message,
                path: "",
                location: "",
            },
        ],
    })
})

export default app
