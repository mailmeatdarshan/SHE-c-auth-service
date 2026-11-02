import { body } from "express-validator"

export default [
    body("email").notEmpty().withMessage("Email is required").trim(),
    body("email").isEmail().withMessage("Invalid email format"),
    body("firstname").notEmpty().withMessage("First name is required").trim(),
    body("lastname").notEmpty().withMessage("Last name is required").trim(),
    body("password").notEmpty().withMessage("Password is required"),
    body("password")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters long"),
]
