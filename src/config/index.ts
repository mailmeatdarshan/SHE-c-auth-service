import { config } from "dotenv"
import path from "path"

config({
    path: path.join(import.meta.dirname, `../../.env.${process.env.NODE_ENV}`),
    quiet: true,
})

// config({ quiet: true })

const {
    PORT,
    NODE_ENV,
    DB_NAME,
    DB_HOST,
    DB_PORT,
    DB_USERNAME,
    DB_PASSWORD,
    REFRESH_TOKEN_SECRET,
    JWKS_URI,
} = process.env

export const Config = {
    PORT,
    NODE_ENV,
    DB_NAME,
    DB_HOST,
    DB_PORT,
    DB_USERNAME,
    DB_PASSWORD,
    REFRESH_TOKEN_SECRET,
    JWKS_URI,
}
