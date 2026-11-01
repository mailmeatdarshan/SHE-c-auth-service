import { body } from "express-validator"

export default [
    body("email").notEmpty().withMessage("Email is required"),
    body("email").isEmail().withMessage("Invalid email format"),
]
