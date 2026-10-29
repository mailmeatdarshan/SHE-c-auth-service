import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "./entities/User.js"
import { Config } from "./config/index.js"

function requiredConfig(name: string, value: string | undefined): string {
    if (!value) {
        throw new Error(`Missing required database configuration: ${name}`)
    }

    return value
}

const port = Number(requiredConfig("DB_PORT", Config.DB_PORT))
if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("DB_PORT must be an integer between 1 and 65535")
}

export const AppDataSource = new DataSource({
    type: "postgres",
    host: requiredConfig("DB_HOST", Config.DB_HOST),
    port,
    username: requiredConfig("DB_USERNAME", Config.DB_USERNAME),
    password: requiredConfig("DB_PASSWORD", Config.DB_PASSWORD),
    database: requiredConfig("DB_NAME", Config.DB_NAME),

    //Dont use this in production - this will drop and recreate your database on every application launch
    synchronize: Config.NODE_ENV === "dev" || Config.NODE_ENV === "test",
    logging: false,
    entities: [User],
    migrations: [],
    subscribers: [],
})
