import { config } from "dotenv"
config({ quiet: true })

const { PORT, NODE_ENV } = process.env

export const Config = {
    PORT,
    NODE_ENV,
}
