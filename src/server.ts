import app from "./app.js"
import { Config } from "./config/index.js"
import logger from "./config/logger.js"

const startServer = () => {
    const PORT = Config.PORT
    try {
        app.listen(PORT, () => {
            logger.error("Testing error log")
            logger.info("Server listening on port", { port: PORT })
        })
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
}

startServer()
