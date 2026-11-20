import { checkSchema } from "express-validator"

export default checkSchema(
    {
        currentPage: {
            customSanitizer: {
                options: (value) => {
                    const parsedValue = Number(value)
                    return Number.isNaN(parsedValue) || parsedValue < 1
                        ? 1
                        : Math.trunc(parsedValue)
                },
            },
        },
        perPage: {
            customSanitizer: {
                options: (value) => {
                    const parsedValue = Number(value)
                    return Number.isNaN(parsedValue) || parsedValue < 1
                        ? 10
                        : Math.min(Math.trunc(parsedValue), 100)
                },
            },
        },
    },
    ["query"],
)
