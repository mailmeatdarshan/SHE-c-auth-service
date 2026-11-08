// @ts-check

import js from "@eslint/js"
import { defineConfig } from "eslint/config"
import tseslint from "typescript-eslint"

export default defineConfig([
    {
        ignores: ["**/dist/**", "**/node_modules/**"],
    },
    {
        files: ["**/*.{js,ts}"],
        extends: [
            js.configs.recommended,
            tseslint.configs.recommendedTypeChecked,
        ],
        languageOptions: {
            parserOptions: {
                projectService: {
                    allowDefaultProject: ["scripts/*.js"],
                },
            },
        },
        rules: {
            // 'no-console':'off',
            // 'dot-notation':'error',
        },
    },
    {
        files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
        extends: [tseslint.configs.disableTypeChecked],
        languageOptions: {
            globals: {
                console: "readonly",
                process: "readonly",
            },
        },
    },
])
